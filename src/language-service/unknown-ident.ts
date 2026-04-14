import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import type { Parser } from '../parsing/parser';
import type { Values } from '../types';
import type { Node, Span } from '../ast/nodes.js';
import type { ParseCache } from './shared/parse-cache.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';
import { buildKnownNames } from './shared/known-names.js';

interface WalkContext {
  readonly doc: TextDocument;
  readonly known: Set<string>;
  readonly out: Diagnostic[];
  readonly reported: Set<string>;
}

function emit(ctx: WalkContext, name: string, span: Span): void {
  const key = name + '@' + span.start + '@' + span.end;
  if (ctx.reported.has(key)) return;
  ctx.reported.add(key);
  ctx.out.push({
    range: spanToRange(ctx.doc, span),
    severity: DiagnosticSeverity.Warning,
    message: `Unknown identifier '${name}'.`,
    source: 'expreszo',
    code: 'unknown-ident'
  });
}

function isInScope(name: string, scope: ReadonlySet<string>, known: ReadonlySet<string>): boolean {
  return scope.has(name) || known.has(name);
}

/**
 * Recursively walk the AST emitting unknown-identifier diagnostics while
 * tracking lexical scopes introduced by `Lambda` and `FunctionDef` parameters.
 * A param declared by an inline function is in scope throughout that
 * function's body but not outside it.
 */
function walkWithScope(node: Node, scope: ReadonlySet<string>, ctx: WalkContext): void {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
      return;
    case 'Ident':
      if (!isInScope(node.name, scope, ctx.known)) emit(ctx, node.name, node.span);
      return;
    case 'NameRef':
      if (!isInScope(node.name, scope, ctx.known)) emit(ctx, node.name, node.span);
      return;
    case 'ArrayLit':
      for (const el of node.elements) {
        if (el.type === 'ArraySpread') walkWithScope(el.argument, scope, ctx);
        else walkWithScope(el, scope, ctx);
      }
      return;
    case 'ObjectLit':
      for (const entry of node.properties) {
        if ('type' in entry && (entry as { type: string }).type === 'ObjectSpread') {
          walkWithScope((entry as import('../ast/nodes.js').ObjectSpread).argument, scope, ctx);
        } else {
          walkWithScope((entry as import('../ast/nodes.js').ObjectProperty).value, scope, ctx);
        }
      }
      return;
    case 'Member': {
      let root: Node = node.object;
      while (root.type === 'Member') root = root.object;
      if (root.type === 'Ident' || root.type === 'NameRef') {
        if (!isInScope(root.name, scope, ctx.known)) {
          emit(ctx, root.name, root.span);
        }
      } else {
        walkWithScope(root, scope, ctx);
      }
      return;
    }
    case 'Unary':
      walkWithScope(node.operand, scope, ctx);
      return;
    case 'Binary':
      walkWithScope(node.left, scope, ctx);
      walkWithScope(node.right, scope, ctx);
      return;
    case 'Ternary':
      walkWithScope(node.a, scope, ctx);
      walkWithScope(node.b, scope, ctx);
      walkWithScope(node.c, scope, ctx);
      return;
    case 'Call':
      walkWithScope(node.callee, scope, ctx);
      for (const a of node.args) walkWithScope(a, scope, ctx);
      return;
    case 'Lambda': {
      const inner = new Set(scope);
      for (const p of node.params) inner.add(p);
      walkWithScope(node.body, inner, ctx);
      return;
    }
    case 'FunctionDef': {
      const inner = new Set(scope);
      for (const p of node.params) inner.add(p);
      walkWithScope(node.body, inner, ctx);
      return;
    }
    case 'Case':
      if (node.subject) walkWithScope(node.subject, scope, ctx);
      for (const arm of node.arms) {
        walkWithScope(arm.when, scope, ctx);
        walkWithScope(arm.then, scope, ctx);
      }
      if (node.else) walkWithScope(node.else, scope, ctx);
      return;
    case 'Sequence':
      for (const s of node.statements) walkWithScope(s, scope, ctx);
      return;
    case 'Paren':
      walkWithScope(node.inner, scope, ctx);
      return;
    default: {
      const exhaustive: never = node;
      throw new Error('unknown-ident: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

/**
 * Emit a `DiagnosticSeverity.Warning` for every identifier/name-ref in the
 * expression whose name is not recognized as a built-in and not listed in the
 * provided `variables` map. Identifiers introduced by inline `Lambda` or
 * `FunctionDef` parameters are treated as in-scope throughout that function's
 * body. Returns an empty array when `variables` is omitted — the check is
 * opt-in per-request.
 */
export function getUnknownIdentDiagnostics(
  doc: TextDocument,
  parser: Parser,
  parseCache: ParseCache,
  variables: Values | undefined
): Diagnostic[] {
  if (!variables) return [];
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const known = buildKnownNames(parser, variables);
  const root = getRootNode(expression);

  const ctx: WalkContext = {
    doc,
    known,
    out: [],
    reported: new Set<string>()
  };
  walkWithScope(root, new Set<string>(), ctx);
  return ctx.out;
}
