import type { Node } from '../../ast/nodes.js';
import type { Expression } from '../../core/expression.js';
import { BaseVisitor } from '../../ast/visitor.js';
import type {
  NumberLit, StringLit, BoolLit, NullLit, UndefinedLit, RawLit,
  ArrayLit, ObjectLit, Ident, NameRef, Member, Unary, Binary, Ternary,
  Call, Lambda, FunctionDef, Case, Sequence, Paren
} from '../../ast/nodes.js';
import { offsetInSpan } from './positions.js';

class PathCollector extends BaseVisitor<void> {
  readonly path: Node[] = [];
  constructor(private readonly offset: number) {
    super();
  }

  private enter(node: Node, recurse?: () => void): void {
    if (!offsetInSpan(this.offset, node.span)) {
      return;
    }
    this.path.push(node);
    if (recurse) recurse();
  }

  visitNumberLit(n: NumberLit): void { this.enter(n); }
  visitStringLit(n: StringLit): void { this.enter(n); }
  visitBoolLit(n: BoolLit): void { this.enter(n); }
  visitNullLit(n: NullLit): void { this.enter(n); }
  visitUndefinedLit(n: UndefinedLit): void { this.enter(n); }
  visitRawLit(n: RawLit): void { this.enter(n); }
  visitIdent(n: Ident): void { this.enter(n); }
  visitNameRef(n: NameRef): void { this.enter(n); }

  visitArrayLit(n: ArrayLit): void {
    this.enter(n, () => {
      for (const el of n.elements) {
        if ('type' in el && el.type === 'ArraySpread') this.visit(el.argument);
        else this.visit(el as Node);
      }
    });
  }

  visitObjectLit(n: ObjectLit): void {
    this.enter(n, () => {
      for (const entry of n.properties) {
        if ('type' in entry) {
          this.visit(entry.argument);
        } else {
          this.visit(entry.value);
        }
      }
    });
  }

  visitMember(n: Member): void {
    this.enter(n, () => this.visit(n.object));
  }

  visitUnary(n: Unary): void {
    this.enter(n, () => this.visit(n.operand));
  }

  visitBinary(n: Binary): void {
    this.enter(n, () => { this.visit(n.left); this.visit(n.right); });
  }

  visitTernary(n: Ternary): void {
    this.enter(n, () => { this.visit(n.a); this.visit(n.b); this.visit(n.c); });
  }

  visitCall(n: Call): void {
    this.enter(n, () => {
      this.visit(n.callee);
      for (const a of n.args) this.visit(a);
    });
  }

  visitLambda(n: Lambda): void {
    this.enter(n, () => this.visit(n.body));
  }

  visitFunctionDef(n: FunctionDef): void {
    this.enter(n, () => this.visit(n.body));
  }

  visitCase(n: Case): void {
    this.enter(n, () => {
      if (n.subject) this.visit(n.subject);
      for (const arm of n.arms) { this.visit(arm.when); this.visit(arm.then); }
      if (n.else) this.visit(n.else);
    });
  }

  visitSequence(n: Sequence): void {
    this.enter(n, () => { for (const s of n.statements) this.visit(s); });
  }

  visitParen(n: Paren): void {
    this.enter(n, () => this.visit(n.inner));
  }
}

/**
 * Returns the ancestor path of AST nodes containing the given offset,
 * from outermost (index 0) to innermost (last).
 */
export function findNodeAt(expression: Expression, offset: number): Node[] {
  const collector = new PathCollector(offset);
  expression.accept(collector);
  return collector.path;
}
