/**
 * Render an AST `Node` back into source text. Matches the legacy
 * `src/core/expression-to-string.ts` output byte-for-byte on the existing
 * parser fixture corpus, including the paren-wrapping produced by the legacy
 * `IEXPR` instruction (represented here as `Paren` nodes).
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
  ObjectProperty,
  ObjectSpread,
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
    return '[' + node.elements.map((e) =>
      e.type === 'ArraySpread' ? '...' + this.visit(e.argument) : this.visit(e)
    ).join(', ') + ']';
  }

  visitObjectLit(node: ObjectLit): string {
    if (node.properties.length === 0) return '{  }';
    const parts = node.properties.map((entry) => {
      if ('type' in entry && (entry as any).type === 'ObjectSpread') {
        return '...' + this.visit((entry as ObjectSpread).argument);
      }
      const p = entry as ObjectProperty;
      const keyStr = p.quoted ? JSON.stringify(p.key) : p.key;
      return `${keyStr}: ${this.visit(p.value)}`;
    });
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
    if (f === '!') return '(' + operand + '!)';
    return '(' + f + ' ' + operand + ')';
  }

  visitBinary(node: Binary): string {
    const n1 = this.visit(node.left);
    const n2 = this.visit(node.right);
    const f = node.op;
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
    throw new Error(`Unsupported ternary operator '${node.op}' in toString conversion`);
  }

  visitCall(node: Call): string {
    const callee = this.visit(node.callee);
    const args = node.args.map((a) => this.visit(a));
    return callee + '(' + args.join(', ') + ')';
  }

  visitLambda(node: Lambda): string {
    const body = this.visit(node.body);
    if (node.params.length === 1) {
      return '(' + node.params[0] + ' => ' + body + ')';
    }
    return '((' + node.params.join(', ') + ') => ' + body + ')';
  }

  visitFunctionDef(node: FunctionDef): string {
    const body = this.visit(node.body);
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
    return parts.join(';');
  }

  visitParen(node: Paren): string {
    return '(' + this.visit(node.inner) + ')';
  }
}

export function nodeToString(node: Node): string {
  return new ToStringVisitor().visit(node);
}
