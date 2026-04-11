import type {
  Node,
  NumberLit,
  StringLit,
  BoolLit,
  NullLit,
  UndefinedLit,
  RawLit,
  ArrayLit,
  ObjectLit,
  Ident,
  NameRef,
  Member,
  Unary,
  Binary,
  Ternary,
  Call,
  Lambda,
  FunctionDef,
  Case,
  Sequence,
  Paren
} from './nodes.js';

/**
 * Generic AST visitor. One method per node kind. `visit` dispatches on the
 * discriminated `type` field via an exhaustive switch — adding a node kind to
 * `Node` without updating the base visitor is a compile-time error.
 */
export interface NodeVisitor<T> {
  visit(node: Node): T;
  visitNumberLit(node: NumberLit): T;
  visitStringLit(node: StringLit): T;
  visitBoolLit(node: BoolLit): T;
  visitNullLit(node: NullLit): T;
  visitUndefinedLit(node: UndefinedLit): T;
  visitRawLit(node: RawLit): T;
  visitArrayLit(node: ArrayLit): T;
  visitObjectLit(node: ObjectLit): T;
  visitIdent(node: Ident): T;
  visitNameRef(node: NameRef): T;
  visitMember(node: Member): T;
  visitUnary(node: Unary): T;
  visitBinary(node: Binary): T;
  visitTernary(node: Ternary): T;
  visitCall(node: Call): T;
  visitLambda(node: Lambda): T;
  visitFunctionDef(node: FunctionDef): T;
  visitCase(node: Case): T;
  visitSequence(node: Sequence): T;
  visitParen(node: Paren): T;
}

/**
 * Convenience base class for visitors that want an exhaustive dispatcher for
 * free. Subclasses only need to implement the `visitX` methods.
 */
export abstract class BaseVisitor<T> implements NodeVisitor<T> {
  visit(node: Node): T {
    switch (node.type) {
      case 'NumberLit':    return this.visitNumberLit(node);
      case 'StringLit':    return this.visitStringLit(node);
      case 'BoolLit':      return this.visitBoolLit(node);
      case 'NullLit':      return this.visitNullLit(node);
      case 'UndefinedLit': return this.visitUndefinedLit(node);
      case 'RawLit':       return this.visitRawLit(node);
      case 'ArrayLit':     return this.visitArrayLit(node);
      case 'ObjectLit':    return this.visitObjectLit(node);
      case 'Ident':        return this.visitIdent(node);
      case 'NameRef':      return this.visitNameRef(node);
      case 'Member':       return this.visitMember(node);
      case 'Unary':        return this.visitUnary(node);
      case 'Binary':       return this.visitBinary(node);
      case 'Ternary':      return this.visitTernary(node);
      case 'Call':         return this.visitCall(node);
      case 'Lambda':       return this.visitLambda(node);
      case 'FunctionDef':  return this.visitFunctionDef(node);
      case 'Case':         return this.visitCase(node);
      case 'Sequence':     return this.visitSequence(node);
      case 'Paren':        return this.visitParen(node);
      default: {
        const exhaustive: never = node;
        throw new Error('NodeVisitor: unhandled node kind ' + String((exhaustive as Node).type));
      }
    }
  }

  abstract visitNumberLit(node: NumberLit): T;
  abstract visitStringLit(node: StringLit): T;
  abstract visitBoolLit(node: BoolLit): T;
  abstract visitNullLit(node: NullLit): T;
  abstract visitUndefinedLit(node: UndefinedLit): T;
  abstract visitRawLit(node: RawLit): T;
  abstract visitArrayLit(node: ArrayLit): T;
  abstract visitObjectLit(node: ObjectLit): T;
  abstract visitIdent(node: Ident): T;
  abstract visitNameRef(node: NameRef): T;
  abstract visitMember(node: Member): T;
  abstract visitUnary(node: Unary): T;
  abstract visitBinary(node: Binary): T;
  abstract visitTernary(node: Ternary): T;
  abstract visitCall(node: Call): T;
  abstract visitLambda(node: Lambda): T;
  abstract visitFunctionDef(node: FunctionDef): T;
  abstract visitCase(node: Case): T;
  abstract visitSequence(node: Sequence): T;
  abstract visitParen(node: Paren): T;
}

/**
 * Walk the tree post-order, invoking `fn` for every node. Useful for
 * aggregate queries (symbol collection, async detection) that don't need to
 * produce a transformed tree.
 */
export function walk(node: Node, fn: (node: Node) => void): void {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
    case 'Ident':
    case 'NameRef':
      break;
    case 'ArrayLit':
      for (const el of node.elements) walk(el, fn);
      break;
    case 'ObjectLit':
      for (const prop of node.properties) walk(prop.value, fn);
      break;
    case 'Member':
      walk(node.object, fn);
      break;
    case 'Unary':
      walk(node.operand, fn);
      break;
    case 'Binary':
      walk(node.left, fn);
      walk(node.right, fn);
      break;
    case 'Ternary':
      walk(node.a, fn);
      walk(node.b, fn);
      walk(node.c, fn);
      break;
    case 'Call':
      walk(node.callee, fn);
      for (const a of node.args) walk(a, fn);
      break;
    case 'Lambda':
      walk(node.body, fn);
      break;
    case 'FunctionDef':
      walk(node.body, fn);
      break;
    case 'Case':
      if (node.subject) walk(node.subject, fn);
      for (const arm of node.arms) {
        walk(arm.when, fn);
        walk(arm.then, fn);
      }
      if (node.else) walk(node.else, fn);
      break;
    case 'Sequence':
      for (const s of node.statements) walk(s, fn);
      break;
    case 'Paren':
      walk(node.inner, fn);
      break;
    default: {
      const exhaustive: never = node;
      throw new Error('walk: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
  fn(node);
}
