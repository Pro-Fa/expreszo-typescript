import { describe, it, expect } from 'vitest';
import { Parser } from '../../index.js';
import type { Node } from '../../src/ast/nodes.js';
import type { NodeVisitor } from '../../src/ast/visitor.js';

/**
 * Phase 5 `Expression#accept` smoke test. The AST root is private (`#root`),
 * so third-party visitors must go through the visitor entry point rather than
 * reading a public field. This test writes a tiny counting visitor and walks
 * a parsed expression with it.
 */
class NodeCounter implements NodeVisitor<void> {
  public counts: Record<string, number> = {};

  visit(node: Node): void {
    this.counts[node.type] = (this.counts[node.type] ?? 0) + 1;
    switch (node.type) {
      case 'Binary':
        this.visit(node.left);
        this.visit(node.right);
        break;
      case 'Unary':
        this.visit(node.operand);
        break;
      case 'Call':
        this.visit(node.callee);
        for (const arg of node.args) this.visit(arg);
        break;
      case 'Member':
        this.visit(node.object);
        break;
      case 'ArrayLit':
        for (const el of node.elements) {
          if (el.type === 'ArraySpread') this.visit(el.argument);
          else this.visit(el);
        }
        break;
      case 'ObjectLit':
        for (const entry of node.properties) {
          if ('type' in entry && (entry as any).type === 'ObjectSpread') {
            this.visit((entry as any).argument);
          } else {
            this.visit((entry as any).value);
          }
        }
        break;
      case 'Ternary':
        this.visit(node.a);
        this.visit(node.b);
        this.visit(node.c);
        break;
      default:
        break;
    }
  }

  // Stub methods required by NodeVisitor<T>. Real traversal happens in visit().
  visitNumberLit(): void {}
  visitStringLit(): void {}
  visitBoolLit(): void {}
  visitNullLit(): void {}
  visitUndefinedLit(): void {}
  visitRawLit(): void {}
  visitArrayLit(): void {}
  visitObjectLit(): void {}
  visitIdent(): void {}
  visitNameRef(): void {}
  visitMember(): void {}
  visitUnary(): void {}
  visitBinary(): void {}
  visitTernary(): void {}
  visitCall(): void {}
  visitLambda(): void {}
  visitFunctionDef(): void {}
  visitCase(): void {}
  visitSequence(): void {}
  visitParen(): void {}
}

describe('Expression.accept visitor entry point', () => {
  const parser = new Parser();

  it('walks a parsed expression through a user-supplied visitor', () => {
    const expr = parser.parse('max(a, b + 1)');
    const counter = new NodeCounter();
    expr.accept(counter);

    expect(counter.counts.Call).toBe(1);
    expect(counter.counts.Binary).toBe(1);
    expect(counter.counts.NumberLit).toBe(1);
    expect(counter.counts.Ident).toBeGreaterThanOrEqual(2);
  });

  it('does not expose the root AST node as a public field', () => {
    const expr = parser.parse('1 + 2') as unknown as Record<string, unknown>;
    expect(expr.root).toBeUndefined();
  });
});
