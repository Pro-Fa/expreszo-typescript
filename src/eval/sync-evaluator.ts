/**
 * Synchronous AST evaluator. Phase 3 split: this path handles every
 * expression whose `async-analysis` result was `false`. Any thenable
 * produced at a `Call` boundary raises `AsyncRequiredError`, and
 * `Expression.evaluate()` catches that and retries on the async path.
 *
 * Semantics match the Phase-2 unified evaluator exactly — `and`/`or`
 * short-circuit and coerce to boolean, `=` assigns through
 * `binaryOps['=']` against a `NameRef` LHS, `?:` evaluates only the
 * selected branch, `Lambda`/`FunctionDef` register the inline function
 * under a `__inline_fn_N__` allow-list key, member and variable lookups
 * run the same `ExpressionValidator` checks, and the root result gets the
 * final `-0 → 0` normalisation.
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
import { AsyncRequiredError, isPromiseLike } from './value.js';

/** Counter for generating unique keys for inline-defined functions. */
let inlineFunctionCounter = 0;

export function evaluateAstSync(
  root: Node,
  expr: Expression,
  values: Values,
  resolver?: VariableResolver
): Value {
  const result = evalNode(root, expr, values, resolver);
  return result === 0 ? 0 : result;
}

function evalNode(
  node: Node,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
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
      throw new Error('sync evaluator: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

function evalSequence(
  node: Sequence,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const stmts = node.statements;
  if (stmts.length === 0) return undefined;
  let last: Value = undefined;
  for (const stmt of stmts) {
    last = evalNode(stmt, expr, values, resolver);
  }
  return last;
}

function evalArray(
  node: ArrayLit,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const result: Value[] = new Array(node.elements.length);
  for (let i = 0; i < node.elements.length; i++) {
    result[i] = evalNode(node.elements[i], expr, values, resolver);
  }
  return result;
}

function evalObject(
  node: ObjectLit,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const obj: Record<string, Value> = {};
  for (const prop of node.properties) {
    obj[prop.key] = evalNode(prop.value, expr, values, resolver);
  }
  return obj as Value;
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
): Value {
  const parent = evalNode(node.object, expr, values, resolver);
  ExpressionValidator.validateMemberAccess(node.property, expr.toString());
  const memberValue =
    parent === undefined || parent === null
      ? undefined
      : (parent as Record<string, unknown>)[node.property];
  ExpressionValidator.validateAllowedFunction(memberValue, expr.functions, expr.toString());
  return memberValue as Value;
}

function evalUnary(
  node: Unary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const fn = expr.unaryOps[node.op];
  return fn(evalNode(node.operand, expr, values, resolver)) as Value;
}

function evalBinary(
  node: Binary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const op = node.op;

  if (op === 'and') {
    const leftValue = evalNode(node.left, expr, values, resolver);
    if (!leftValue) return false;
    return !!evalNode(node.right, expr, values, resolver);
  }

  if (op === 'or') {
    const leftValue = evalNode(node.left, expr, values, resolver);
    if (leftValue) return true;
    return !!evalNode(node.right, expr, values, resolver);
  }

  if (op === '=') {
    if (node.left.type !== 'NameRef') {
      throw new Error('sync evaluator: assignment LHS must be a NameRef, got ' + node.left.type);
    }
    const name = node.left.name;
    const fn = expr.binaryOps['='];
    const rightValue = evalNode(node.right, expr, values, resolver);
    return (fn as unknown as (a: string, b: Value, c: Values) => Value)(name, rightValue, values);
  }

  const fn = expr.binaryOps[op];
  const leftValue = evalNode(node.left, expr, values, resolver);
  const rightValue = evalNode(node.right, expr, values, resolver);
  return fn(leftValue, rightValue) as Value;
}

function evalTernary(
  node: Ternary,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  if (node.op === '?') {
    const cond = evalNode(node.a, expr, values, resolver);
    return cond
      ? evalNode(node.b, expr, values, resolver)
      : evalNode(node.c, expr, values, resolver);
  }
  const fn = expr.ternaryOps[node.op];
  const a = evalNode(node.a, expr, values, resolver);
  const b = evalNode(node.b, expr, values, resolver);
  const c = evalNode(node.c, expr, values, resolver);
  return (fn as unknown as (a: Value, b: Value, c: Value) => Value)(a, b, c);
}

function evalCall(
  node: Call,
  expr: Expression,
  values: Values,
  resolver: VariableResolver | undefined
): Value {
  const callee = evalNode(node.callee, expr, values, resolver);
  const args: Value[] = new Array(node.args.length);
  for (let i = 0; i < node.args.length; i++) {
    args[i] = evalNode(node.args[i], expr, values, resolver);
  }
  ExpressionValidator.validateFunctionCall(callee, String(callee), expr.toString());
  ExpressionValidator.validateAllowedFunction(callee, expr.functions, expr.toString());
  const result = (callee as (...a: Value[]) => Value).apply(undefined, args);
  if (isPromiseLike(result)) throw new AsyncRequiredError();
  return result;
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
  const arrowFunction = function (...functionArguments: Value[]): Value {
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
  const userDefinedFunction = function (...functionArguments: Value[]): Value {
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
): Value {
  const hasSubject = !!node.subject;
  const subject = node.subject ? evalNode(node.subject, expr, values, resolver) : undefined;
  for (const arm of node.arms) {
    const whenValue = evalNode(arm.when, expr, values, resolver);
    let matches: boolean;
    if (hasSubject) {
      const eq = expr.binaryOps['=='];
      matches = !!(eq as unknown as (a: Value, b: Value) => boolean)(whenValue, subject);
    } else {
      matches = !!whenValue;
    }
    if (matches) return evalNode(arm.then, expr, values, resolver);
  }
  if (node.else) return evalNode(node.else, expr, values, resolver);
  return undefined;
}
