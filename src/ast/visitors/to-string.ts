/**
 * Render an AST `Node` back into source text. Matches the legacy
 * `src/core/expression-to-string.ts` output byte-for-byte on the existing
 * parser fixture corpus, including the paren-wrapping produced by the legacy
 * `IEXPR` instruction (represented here as `Paren` nodes).
 *
 * Two modes:
 *   - `toString(node)` — human-readable, used by `Expression.toString()`.
 *   - `toJSString(node)` — JavaScript-compatible, used by
 *     `Expression.toJSFunction()` to build the body of the generated function.
 */
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
} from '../nodes.js';
import { BaseVisitor } from '../visitor.js';

function escapeValue(v: unknown): string {
  if (typeof v === 'string') {
    return JSON.stringify(v).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }
  return String(v);
}

export class ToStringVisitor extends BaseVisitor<string> {
  constructor(private readonly toJS: boolean = false) {
    super();
  }

  visitNumberLit(node: NumberLit): string {
    // Mirror the legacy RPN behaviour: negative numeric scalars are wrapped
    // in parens so that the emitted form re-parses as a unary-minus rather
    // than a binary subtraction against whatever precedes it.
    if (node.value < 0) return '(' + node.value + ')';
    return String(node.value);
  }

  visitStringLit(node: StringLit): string {
    return escapeValue(node.value);
  }

  visitBoolLit(node: BoolLit): string {
    return String(node.value);
  }

  visitNullLit(_node: NullLit): string {
    return 'null';
  }

  visitUndefinedLit(_node: UndefinedLit): string {
    return 'undefined';
  }

  visitRawLit(node: RawLit): string {
    const v = node.value;
    if (Array.isArray(v)) {
      return '[' + v.map(escapeValue).join(', ') + ']';
    }
    return escapeValue(v);
  }

  visitArrayLit(node: ArrayLit): string {
    return '[' + node.elements.map((e) => this.visit(e)).join(', ') + ']';
  }

  visitObjectLit(node: ObjectLit): string {
    if (node.properties.length === 0) return '{  }';
    const parts = node.properties.map((p) => `${p.key}: ${this.visit(p.value)}`);
    return '{ ' + parts.join(', ') + ' }';
  }

  visitIdent(node: Ident): string {
    return node.name;
  }

  visitNameRef(node: NameRef): string {
    return node.name;
  }

  visitMember(node: Member): string {
    return this.visit(node.object) + '.' + node.property;
  }

  visitUnary(node: Unary): string {
    const operand = this.visit(node.operand);
    const f = node.op;
    if (f === '-' || f === '+') {
      return '(' + f + operand + ')';
    }
    if (this.toJS) {
      if (f === 'not') return '(!' + operand + ')';
      if (f === '!') return 'fac(' + operand + ')';
      return f + '(' + operand + ')';
    }
    if (f === '!') return '(' + operand + '!)';
    return '(' + f + ' ' + operand + ')';
  }

  visitBinary(node: Binary): string {
    const n1 = this.visit(node.left);
    const n2 = this.visit(node.right);
    const f = node.op;
    if (this.toJS) {
      if (f === '^') return 'Math.pow(' + n1 + ', ' + n2 + ')';
      if (f === 'and' || f === '&&') return '(!!' + n1 + ' && !!' + n2 + ')';
      if (f === 'or' || f === '||') return '(!!' + n1 + ' || !!' + n2 + ')';
      if (f === '|') {
        return '(function(a,b){ return Array.isArray(a) && Array.isArray(b) ? a.concat(b) : String(a) + String(b); }((' + n1 + '),(' + n2 + ')))';
      }
      if (f === '==') return '(' + n1 + ' === ' + n2 + ')';
      if (f === '!=') return '(' + n1 + ' !== ' + n2 + ')';
      if (f === '[') return n1 + '[(' + n2 + ') | 0]';
      return '(' + n1 + ' ' + f + ' ' + n2 + ')';
    }
    if (f === '[') return n1 + '[' + n2 + ']';
    return '(' + n1 + ' ' + f + ' ' + n2 + ')';
  }

  visitTernary(node: Ternary): string {
    const n1 = this.visit(node.a);
    const n2 = this.visit(node.b);
    const n3 = this.visit(node.c);
    if (node.op === '?') {
      return '(' + n1 + ' ? ' + n2 + ' : ' + n3 + ')';
    }
    throw new Error('invalid Expression');
  }

  visitCall(node: Call): string {
    const callee = this.visit(node.callee);
    const args = node.args.map((a) => this.visit(a));
    return callee + '(' + args.join(', ') + ')';
  }

  visitLambda(node: Lambda): string {
    const body = this.visit(node.body);
    if (this.toJS) {
      return '((' + node.params.join(', ') + ') => ' + body + ')';
    }
    if (node.params.length === 1) {
      return '(' + node.params[0] + ' => ' + body + ')';
    }
    return '((' + node.params.join(', ') + ') => ' + body + ')';
  }

  visitFunctionDef(node: FunctionDef): string {
    const body = this.visit(node.body);
    if (this.toJS) {
      return '(' + node.name + ' = function(' + node.params.join(', ') + ') { return ' + body + ' })';
    }
    return '(' + node.name + '(' + node.params.join(', ') + ') = ' + body + ')';
  }

  visitCase(node: Case): string {
    const arms = node.arms.map((arm) => {
      return `when ${this.visit(arm.when)} then ${this.visit(arm.then)}`;
    });
    const tail = node.else ? [...arms, `else ${this.visit(node.else)}`] : arms;
    if (node.subject) {
      return `case ${this.visit(node.subject)} ` + tail.join(' ') + ' end';
    }
    return 'case ' + tail.join(' ') + ' end';
  }

  visitSequence(node: Sequence): string {
    const parts = node.statements.map((s) => this.visit(s));
    const sep = this.toJS ? ',' : ';';
    return parts.join(sep);
  }

  visitParen(node: Paren): string {
    return '(' + this.visit(node.inner) + ')';
  }
}

export function nodeToString(node: Node, toJS: boolean = false): string {
  return new ToStringVisitor(toJS).visit(node);
}
