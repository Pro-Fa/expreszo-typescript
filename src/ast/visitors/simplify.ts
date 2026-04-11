/**
 * Simplify an AST by folding constant subtrees and inlining known variable
 * values. Semantic parity with the legacy `src/core/simplify.ts` on the
 * existing test corpus — the folded output re-serialises to the same string
 * the legacy RPN-based simplifier produced.
 *
 * Folding rules mirror the legacy stack-based logic:
 *   - `Unary`/`Binary`/`Ternary(?)` fold when every operand reduces to a
 *     constant literal; otherwise the structure is preserved verbatim.
 *   - `Ident` folds to the bound value when it appears in `values`.
 *   - `Paren`, `Sequence`, `ArrayLit`, `ObjectLit`, `Member`, `Call`,
 *     `Lambda`, `FunctionDef`, `Case` recurse into their children; no
 *     folding is attempted at the composite level.
 */
import {
  type Node,
  type Binary,
  type Unary,
  type Ternary,
  mkNumber,
  mkString,
  mkBool,
  mkNull,
  mkUndefined,
  mkRaw,
  mkArray,
  mkObject,
  mkBinary,
  mkUnary,
  mkTernary,
  mkCall,
  mkMember,
  mkLambda,
  mkFunctionDef,
  mkCase,
  mkSequence,
  mkParen
} from '../nodes.js';
import type { OperatorFunction } from '../../types/parser.js';

export interface SimplifyOps {
  readonly unaryOps: Record<string, OperatorFunction>;
  readonly binaryOps: Record<string, OperatorFunction>;
  readonly ternaryOps: Record<string, OperatorFunction>;
  readonly values: Record<string, unknown>;
}

function isConstLiteral(node: Node): boolean {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
      return true;
    default:
      return false;
  }
}

function literalValue(node: Node): unknown {
  switch (node.type) {
    case 'NumberLit':    return node.value;
    case 'StringLit':    return node.value;
    case 'BoolLit':      return node.value;
    case 'NullLit':      return null;
    case 'UndefinedLit': return undefined;
    case 'RawLit':       return node.value;
    default:
      throw new Error('simplify: literalValue called on non-literal ' + node.type);
  }
}

function wrapLiteral(value: unknown): Node {
  if (typeof value === 'number') return mkNumber(value);
  if (typeof value === 'string') return mkString(value);
  if (typeof value === 'boolean') return mkBool(value);
  if (value === null) return mkNull();
  if (value === undefined) return mkUndefined();
  if (Array.isArray(value)) {
    return mkArray(value.map(wrapLiteral));
  }
  return mkRaw(value);
}

function simplifyNode(node: Node, ops: SimplifyOps): Node {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
    case 'NameRef':
      return node;
    case 'Ident':
      if (Object.prototype.hasOwnProperty.call(ops.values, node.name)) {
        return wrapLiteral(ops.values[node.name]);
      }
      return node;
    case 'ArrayLit':
      return mkArray(node.elements.map((e) => simplifyNode(e, ops)), node.span);
    case 'ObjectLit':
      return mkObject(
        node.properties.map((p) => ({ key: p.key, value: simplifyNode(p.value, ops) })),
        node.span
      );
    case 'Member': {
      const obj = simplifyNode(node.object, ops);
      if (isConstLiteral(obj)) {
        const v = literalValue(obj);
        if (v !== null && v !== undefined) {
          return wrapLiteral((v as Record<string, unknown>)[node.property]);
        }
      }
      return mkMember(obj, node.property, node.span);
    }
    case 'Unary': {
      const operand = simplifyNode(node.operand, ops);
      if (isConstLiteral(operand)) {
        const f = ops.unaryOps[node.op];
        if (f) {
          return wrapLiteral(f(literalValue(operand)));
        }
      }
      return mkUnary(node.op, operand, node.span) as Unary;
    }
    case 'Binary': {
      const left = simplifyNode(node.left, ops);
      const right = simplifyNode(node.right, ops);
      if (isConstLiteral(left) && isConstLiteral(right)) {
        const f = ops.binaryOps[node.op];
        if (f) {
          return wrapLiteral(f(literalValue(left), literalValue(right)));
        }
      }
      return mkBinary(node.op, left, right, node.span) as Binary;
    }
    case 'Ternary': {
      const a = simplifyNode(node.a, ops);
      const b = simplifyNode(node.b, ops);
      const c = simplifyNode(node.c, ops);
      if (isConstLiteral(a) && isConstLiteral(b) && isConstLiteral(c)) {
        if (node.op === '?') {
          return literalValue(a) ? (b as Node) : (c as Node);
        }
        const f = ops.ternaryOps[node.op];
        if (f) {
          return wrapLiteral(f(literalValue(a), literalValue(b), literalValue(c)));
        }
      }
      return mkTernary(node.op, a, b, c, node.span) as Ternary;
    }
    case 'Call':
      return mkCall(
        simplifyNode(node.callee, ops),
        node.args.map((a) => simplifyNode(a, ops)),
        node.span
      );
    case 'Lambda':
      return mkLambda(node.params, simplifyNode(node.body, ops), node.span);
    case 'FunctionDef':
      return mkFunctionDef(node.name, node.params, simplifyNode(node.body, ops), node.span);
    case 'Case': {
      const subject = node.subject ? simplifyNode(node.subject, ops) : null;
      const arms = node.arms.map((arm) => ({
        when: simplifyNode(arm.when, ops),
        then: simplifyNode(arm.then, ops)
      }));
      const elseBranch = node.else ? simplifyNode(node.else, ops) : null;
      return mkCase(subject, arms, elseBranch, node.span);
    }
    case 'Sequence':
      return mkSequence(node.statements.map((s) => simplifyNode(s, ops)), node.span);
    case 'Paren':
      return mkParen(simplifyNode(node.inner, ops), node.span);
    default: {
      const exhaustive: never = node;
      throw new Error('simplify: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

export function simplifyAst(node: Node, ops: SimplifyOps): Node {
  return simplifyNode(node, ops);
}
