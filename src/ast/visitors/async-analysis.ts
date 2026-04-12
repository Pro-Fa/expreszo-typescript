/**
 * Walks an AST and reports whether any `Call` in the tree is known to return
 * a promise, so `Expression.evaluate()` can route to the sync or async
 * evaluator without duck-typing the result shape at runtime.
 *
 * Detection rules, from cheapest to most permissive:
 *
 *   1. A `Call` whose callee is an `Ident` looks up `parser.functions[name]`
 *      and checks for a descriptor match in `BUILTIN_FUNCTIONS` with
 *      `async: true`. This covers every registered descriptor-based
 *      function.
 *   2. If the resolved implementation is a native `async` function (its
 *      `constructor.name === 'AsyncFunction'`), treat it as async. This
 *      catches the `parser.functions.foo = async () => …` registration
 *      pattern.
 *   3. `Call` nodes whose callee is a non-`Ident` expression (member access,
 *      lambda-call, array index) default to sync — analysis can't see the
 *      target at parse time. `SyncEvaluator` catches any thenable produced
 *      along the way and raises `AsyncRequiredError`, which the top-level
 *      `Expression.evaluate()` uses to fall back to the async path.
 *
 * This keeps the common case (no async calls anywhere) fully sync, while
 * not penalising dynamic callees that never actually go async. The price
 * is a one-time re-evaluation if the fallback fires — amortised because
 * `Expression.evaluate()` caches the outcome on the expression instance.
 */
import type { Node } from '../nodes.js';
import type { OperatorFunction } from '../../types/parser.js';
import { BUILTIN_FUNCTIONS } from '../../registry/builtin/functions.js';

const ASYNC_BUILTIN_NAMES: ReadonlySet<string> = new Set(
  BUILTIN_FUNCTIONS.filter((d) => d.async).map((d) => d.name)
);

function isAsyncImplementation(fn: OperatorFunction | undefined): boolean {
  if (typeof fn !== 'function') return false;
  const ctorName = (fn as { constructor?: { name?: string } }).constructor?.name;
  return ctorName === 'AsyncFunction';
}

export interface AsyncAnalysisContext {
  readonly functions: Record<string, OperatorFunction>;
}

export function containsAsyncCall(node: Node, ctx: AsyncAnalysisContext): boolean {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
    case 'NameRef':
    case 'Ident':
      return false;
    case 'Paren':
      return containsAsyncCall(node.inner, ctx);
    case 'Sequence':
      return node.statements.some((s) => containsAsyncCall(s, ctx));
    case 'ArrayLit':
      return node.elements.some((e) =>
        e.type === 'ArraySpread' ? containsAsyncCall(e.argument, ctx) : containsAsyncCall(e, ctx)
      );
    case 'ObjectLit':
      return node.properties.some((entry) =>
        'type' in entry && (entry as any).type === 'ObjectSpread'
          ? containsAsyncCall((entry as import('../nodes.js').ObjectSpread).argument, ctx)
          : containsAsyncCall((entry as import('../nodes.js').ObjectProperty).value, ctx)
      );
    case 'Member':
      return containsAsyncCall(node.object, ctx);
    case 'Unary':
      return containsAsyncCall(node.operand, ctx);
    case 'Binary':
      return containsAsyncCall(node.left, ctx) || containsAsyncCall(node.right, ctx);
    case 'Ternary':
      return (
        containsAsyncCall(node.a, ctx) ||
        containsAsyncCall(node.b, ctx) ||
        containsAsyncCall(node.c, ctx)
      );
    case 'Call': {
      if (calleeIsAsync(node.callee, ctx)) return true;
      if (containsAsyncCall(node.callee, ctx)) return true;
      return node.args.some((a) => containsAsyncCall(a, ctx));
    }
    case 'Lambda':
      return containsAsyncCall(node.body, ctx);
    case 'FunctionDef':
      return containsAsyncCall(node.body, ctx);
    case 'Case': {
      if (node.subject && containsAsyncCall(node.subject, ctx)) return true;
      for (const arm of node.arms) {
        if (containsAsyncCall(arm.when, ctx)) return true;
        if (containsAsyncCall(arm.then, ctx)) return true;
      }
      if (node.else && containsAsyncCall(node.else, ctx)) return true;
      return false;
    }
    default: {
      const exhaustive: never = node;
      throw new Error('async-analysis: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

function calleeIsAsync(callee: Node, ctx: AsyncAnalysisContext): boolean {
  if (callee.type !== 'Ident') return false;
  const name = callee.name;
  if (ASYNC_BUILTIN_NAMES.has(name)) return true;
  return isAsyncImplementation(ctx.functions[name]);
}
