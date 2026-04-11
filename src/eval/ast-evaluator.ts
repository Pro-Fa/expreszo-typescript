/**
 * AST-native evaluator. Walks the `Node` tree directly instead of the legacy
 * RPN `Instruction[]` stream. Phase 2 keeps both evaluators alive so the round-
 * trip harness can assert parity — Phase 3 splits this into sync / async
 * variants and deletes `src/core/evaluate.ts`.
 *
 * Semantics mirror `src/core/evaluate.ts` exactly:
 *   - `and` / `or` short-circuit and coerce the right-hand side to boolean.
 *   - `=` assigns `values[name] = eval(rhs)` via the registered binary op; the
 *     LHS must be a `NameRef` (the legacy parser only emits IVARNAME there).
 *   - `?:` ternary evaluates only the selected branch.
 *   - `Call` looks up the callee first, then evaluates args left-to-right.
 *   - `Lambda` and `FunctionDef` close over the current scope, register the
 *     resulting function under a unique `__inline_fn_N__` key in
 *     `expr.functions` so the allow-list lets subsequent calls through, and
 *     `FunctionDef` also writes the function into `values` under its name.
 *   - Member and variable lookups run the same `ExpressionValidator` checks
 *     the legacy evaluator ran.
 *   - Promises in any sub-result propagate through dedicated `then` / `thenAll`
 *     helpers so the whole evaluator is promise-aware without duck-typing at
 *     the top of a for-loop the way the legacy evaluator does.
 *   - Final `-0 → 0` normalisation is applied to the root result, matching
 *     `resolveFinalValue` in the legacy evaluator.
 */
import type {
  Node,
  ArrayLit,
  ObjectLit,
  Ident,
  Member,
  Unary,
  Binary,
  Ternary,
  Call,
  Lambda,
  FunctionDef,
  Case,
  Sequence
} from '../ast/nodes.js';
import type { Expression } from '../core/expression.js';
import type {
  Value,
  Values,
  VariableResolveResult,
  VariableResolver
} from '../types/values.js';
import { VariableError } from '../types/errors.js';
import { ExpressionValidator } from '../validation/expression-validator.js';

/**
 * Counter for generating unique keys for inline-defined functions. Mirrors
 * the module-level counter in `src/core/evaluate.ts` — not shared with it,
 * but the same monotonic-unique-key strategy.
 */
let inlineFunctionCounter = 0;

function isPromise(obj: unknown): obj is Promise<unknown> {
  return !!obj && typeof obj === 'object' && typeof (obj as { then?: unknown }).then === 'function';
}

/**
 * Sequence two promise-aware steps. When `v` is a plain value, `fn` runs
 * synchronously and returns its own plain-or-promise result; when `v` is a
 * promise, `fn` runs inside `.then`. This is the one place where promise
 * propagation is threaded through the evaluator.
 */
function then<T, R>(v: T | Promise<T>, fn: (value: T) => R | Promise<R>): R | Promise<R> {
  if (isPromise(v)) return (v as Promise<T>).then(fn);
  return fn(v as T);
}

/**
 * If any element in `items` is a promise, resolve the whole list via
 * `Promise.all`; otherwise return the list unchanged. Used by `Call`,
 * `ArrayLit`, and `ObjectLit` to evaluate their children in parallel.
 */
function thenAll<T>(items: readonly (T | Promise<T>)[]): T[] | Promise<T[]> {
  for (let i = 0; i < items.length; i++) {
    if (isPromise(items[i])) {
      return Promise.all(items);
    }
  }
  return items as T[];
}

/**
 * Evaluate an AST root against a scope. Returns the result synchronously when
 * every node evaluates synchronously; falls back to a promise as soon as any
 * sub-expression returns one (e.g. an async function registered on the
 * parser).
 */
export function evaluateAst(
  root: Node,
  expr: Expression,
  values: Values,
  resolver?: VariableResolver
): Value | Promise<Value> {
  const result = evalNode(root, expr, values, resolver);
  if (isPromise(result)) {
    return (result as Promise<Value>).then(v => (v === 0 ? 0 : v));
  }
  return result === 0 ? 0 : result;
}

function evalNode(
  node: Node,
  expr: Expression,
  values: Values,
  resolver?: VariableResolver
): Value | Promise<Value> {
  switch (node.type) {
    case 'NumberLit':    return node.value;
    case 'StringLit':    return node.value;
    case 'BoolLit':      return node.value;
    case 'NullLit':      return null;
    case 'UndefinedLit': return undefined;
    case 'RawLit':       return node.value as Value;
    case 'Paren':        return evalNode(node.inner, expr, values, resolver);
    case 'Sequence':     return evalSequence(node, expr, values, resolver);
    case 'ArrayLit':     return evalArray(node, expr, values, resolver);
    case 'ObjectLit':    return evalObject(node, expr, values, resolver);
    case 'Ident':        return evalIdent(node, expr, values, resolver);
    case 'NameRef':      return node.name;
    case 'Member':       return evalMember(node, expr, values, resolver);
    case 'Unary':        return evalUnary(node, expr, values, resolver);
    case 'Binary':       return evalBinary(node, expr, values, resolver);
    case 'Ternary':      return evalTernary(node, expr, values, resolver);
    case 'Call':         return evalCall(node, expr, values, resolver);
    case 'Lambda':       return evalLambda(node, expr, values, resolver);
    case 'FunctionDef':  return evalFunctionDef(node, expr, values, resolver);
    case 'Case':         return evalCase(node, expr, values, resolver);
    default: {
      const exhaustive: never = node;
      throw new Error('AST evaluator: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

function evalSequence(
  node: Sequence,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  const stmts = node.statements;
  if (stmts.length === 0) return undefined;
  const last = stmts.length - 1;
  const step = (i: number): Value | Promise<Value> => {
    const v = evalNode(stmts[i], expr, values, resolver);
    if (i === last) return v;
    return then(v, () => step(i + 1));
  };
  return step(0);
}

function evalArray(
  node: ArrayLit,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  const elementResults = node.elements.map(el => evalNode(el, expr, values, resolver));
  return then(thenAll(elementResults), resolved => resolved as Value);
}

function evalObject(
  node: ObjectLit,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  const keys: string[] = [];
  const valueResults: Array<Value | Promise<Value>> = [];
  for (const prop of node.properties) {
    keys.push(prop.key);
    valueResults.push(evalNode(prop.value, expr, values, resolver));
  }
  return then(thenAll(valueResults), resolved => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < keys.length; i++) obj[keys[i]] = resolved[i];
    return obj as Value;
  });
}

function evalIdent(
  node: Ident,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const name = node.name;
  ExpressionValidator.validateVariableName(name, expr.toString());

  if (name in expr.functions) {
    return expr.functions[name] as unknown as Value;
  }
  if (name in expr.unaryOps && expr.parser.isOperatorEnabled(name)) {
    return expr.unaryOps[name] as unknown as Value;
  }
  if (name in values) {
    const variableValue = values[name];
    ExpressionValidator.validateAllowedFunction(variableValue, expr.functions, expr.toString());
    return variableValue;
  }

  let resolved: VariableResolveResult | undefined;
  if (resolver) resolved = resolver(name);
  if (resolved === undefined) resolved = expr.parser.resolve(name);

  if (resolved && typeof resolved === 'object') {
    if ('alias' in resolved && typeof resolved.alias === 'string') {
      if (resolved.alias in values) {
        const aliasValue = values[resolved.alias];
        ExpressionValidator.validateAllowedFunction(aliasValue, expr.functions, expr.toString());
        return aliasValue;
      }
    } else if ('value' in resolved) {
      const resolvedValue = resolved.value;
      ExpressionValidator.validateAllowedFunction(resolvedValue, expr.functions, expr.toString());
      return resolvedValue;
    }
  }

  throw new VariableError(name, { expression: expr.toString() });
}

function evalMember(
  node: Member,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  return then(evalNode(node.object, expr, values, resolver), parent => {
    ExpressionValidator.validateMemberAccess(node.property, expr.toString());
    const memberValue =
      parent === undefined || parent === null
        ? undefined
        : (parent as Record<string, unknown>)[node.property];
    ExpressionValidator.validateAllowedFunction(memberValue, expr.functions, expr.toString());
    return memberValue as Value;
  });
}

function evalUnary(
  node: Unary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  const fn = expr.unaryOps[node.op];
  return then(evalNode(node.operand, expr, values, resolver), v => fn(v) as Value);
}

function evalBinary(
  node: Binary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  const op = node.op;

  if (op === 'and') {
    return then(evalNode(node.left, expr, values, resolver), leftValue => {
      if (!leftValue) return false;
      return then(evalNode(node.right, expr, values, resolver), rightValue => !!rightValue);
    });
  }

  if (op === 'or') {
    return then(evalNode(node.left, expr, values, resolver), leftValue => {
      if (leftValue) return true;
      return then(evalNode(node.right, expr, values, resolver), rightValue => !!rightValue);
    });
  }

  if (op === '=') {
    if (node.left.type !== 'NameRef') {
      throw new Error(
        'AST evaluator: assignment LHS must be a NameRef, got ' + node.left.type
      );
    }
    const name = node.left.name;
    const fn = expr.binaryOps['='];
    return then(evalNode(node.right, expr, values, resolver), rightValue => {
      return (fn as unknown as (a: string, b: Value, c: Values) => Value)(name, rightValue, values);
    });
  }

  const fn = expr.binaryOps[op];
  return then(evalNode(node.left, expr, values, resolver), leftValue => {
    return then(evalNode(node.right, expr, values, resolver), rightValue => fn(leftValue, rightValue) as Value);
  });
}

function evalTernary(
  node: Ternary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  if (node.op === '?') {
    return then(evalNode(node.a, expr, values, resolver), cond => {
      return cond ? evalNode(node.b, expr, values, resolver) : evalNode(node.c, expr, values, resolver);
    });
  }
  const fn = expr.ternaryOps[node.op];
  return then(evalNode(node.a, expr, values, resolver), a => {
    return then(evalNode(node.b, expr, values, resolver), b => {
      return then(evalNode(node.c, expr, values, resolver), c =>
        (fn as unknown as (a: Value, b: Value, c: Value) => Value)(a, b, c));
    });
  });
}

function evalCall(
  node: Call,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  return then(evalNode(node.callee, expr, values, resolver), callee => {
    const argResults = node.args.map(arg => evalNode(arg, expr, values, resolver));
    return then(thenAll(argResults), args => {
      ExpressionValidator.validateFunctionCall(callee, String(callee), expr.toString());
      ExpressionValidator.validateAllowedFunction(callee, expr.functions, expr.toString());
      return (callee as (...a: Value[]) => Value | Promise<Value>).apply(undefined, args as Value[]);
    });
  });
}

function evalLambda(
  node: Lambda,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const params = node.params;
  const body = node.body;
  const capturedValues = values;
  const arrowFunction = function (...functionArguments: Value[]): Value | Promise<Value> {
    const localScope: Values = Object.assign({}, capturedValues);
    for (let i = 0; i < params.length; i++) {
      localScope[params[i]] = functionArguments[i];
    }
    return evalNode(body, expr, localScope, resolver);
  };
  Object.defineProperty(arrowFunction, 'name', { value: '(arrow)', writable: false });
  const uniqueKey = `__inline_fn_${inlineFunctionCounter++}__`;
  expr.functions[uniqueKey] = arrowFunction as unknown as Expression['functions'][string];
  return arrowFunction as unknown as Value;
}

function evalFunctionDef(
  node: FunctionDef,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const params = node.params;
  const body = node.body;
  const name = node.name;
  const capturedValues = values;
  const userDefinedFunction = function (...functionArguments: Value[]): Value | Promise<Value> {
    const localScope: Values = Object.assign({}, capturedValues);
    for (let i = 0; i < params.length; i++) {
      localScope[params[i]] = functionArguments[i];
    }
    return evalNode(body, expr, localScope, resolver);
  };
  Object.defineProperty(userDefinedFunction, 'name', { value: name, writable: false });
  const uniqueKey = `__inline_fn_${inlineFunctionCounter++}__`;
  expr.functions[uniqueKey] = userDefinedFunction as unknown as Expression['functions'][string];
  values[name] = userDefinedFunction as unknown as Value;
  return userDefinedFunction as unknown as Value;
}

function evalCase(
  node: Case,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value | Promise<Value> {
  if (node.subject) {
    return then(evalNode(node.subject, expr, values, resolver), subject => {
      return evalCaseArms(node, subject, expr, values, resolver, 0, true);
    });
  }
  return evalCaseArms(node, undefined, expr, values, resolver, 0, false);
}

function evalCaseArms(
  node: Case,
  subject: Value,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined,
  index: number,
  hasSubject: boolean
): Value | Promise<Value> {
  if (index >= node.arms.length) {
    if (node.else) return evalNode(node.else, expr, values, resolver);
    return undefined;
  }
  const arm = node.arms[index];
  return then(evalNode(arm.when, expr, values, resolver), whenValue => {
    let matches: boolean;
    if (hasSubject) {
      const eq = expr.binaryOps['=='];
      matches = !!(eq as unknown as (a: Value, b: Value) => boolean)(whenValue, subject);
    } else {
      matches = !!whenValue;
    }
    if (matches) return evalNode(arm.then, expr, values, resolver);
    return evalCaseArms(node, subject, expr, values, resolver, index + 1, hasSubject);
  });
}
