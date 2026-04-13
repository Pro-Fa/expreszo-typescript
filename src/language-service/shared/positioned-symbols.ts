import { BaseVisitor, walk } from '../../ast/visitor.js';
import type {
  Node, Span,
  NumberLit, StringLit, BoolLit, NullLit, UndefinedLit, RawLit,
  ArrayLit, ObjectLit, Ident, NameRef, Member, Unary, Binary, Ternary,
  Call, Lambda, FunctionDef, Case, Sequence, Paren
} from '../../ast/nodes.js';
import type { Expression } from '../../core/expression.js';

export type SymbolKind = 'function' | 'variable' | 'member';

export interface PositionedSymbol {
  name: string;
  kind: SymbolKind;
  span: Span;
  /** For members, the full dotted path (e.g. "user.age"). Same as name for plain identifiers. */
  fullPath: string;
}

class RootExtractor extends BaseVisitor<Node> {
  visitNumberLit(n: NumberLit): Node { return n; }
  visitStringLit(n: StringLit): Node { return n; }
  visitBoolLit(n: BoolLit): Node { return n; }
  visitNullLit(n: NullLit): Node { return n; }
  visitUndefinedLit(n: UndefinedLit): Node { return n; }
  visitRawLit(n: RawLit): Node { return n; }
  visitArrayLit(n: ArrayLit): Node { return n; }
  visitObjectLit(n: ObjectLit): Node { return n; }
  visitIdent(n: Ident): Node { return n; }
  visitNameRef(n: NameRef): Node { return n; }
  visitMember(n: Member): Node { return n; }
  visitUnary(n: Unary): Node { return n; }
  visitBinary(n: Binary): Node { return n; }
  visitTernary(n: Ternary): Node { return n; }
  visitCall(n: Call): Node { return n; }
  visitLambda(n: Lambda): Node { return n; }
  visitFunctionDef(n: FunctionDef): Node { return n; }
  visitCase(n: Case): Node { return n; }
  visitSequence(n: Sequence): Node { return n; }
  visitParen(n: Paren): Node { return n; }
}

/**
 * Extract the root AST node from an Expression. Prefer using the higher-level
 * helpers in this module; this is only exposed for advanced consumers.
 */
export function getRootNode(expression: Expression): Node {
  return expression.accept(new RootExtractor());
}

/**
 * Walk the AST collecting every Ident / NameRef / Member chain along with
 * its source span. Unlike `getSymbolsFromNode` which flattens to strings,
 * this preserves positions so the language service can build LSP
 * DocumentSymbol / Location objects.
 *
 * Identifiers used as the callee of a `Call` node are tagged `kind: 'function'`.
 * Plain identifiers are `'variable'`. Member chains rooted on an identifier are
 * `'member'` with `fullPath` set to the dotted path.
 */
const ALPHA_OP_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function collectPositionedSymbols(expression: Expression): PositionedSymbol[] {
  const root = getRootNode(expression);
  const callees = new WeakSet<Node>();
  walk(root, (n) => {
    if (n.type === 'Call') {
      callees.add(n.callee);
    }
  });

  const out: PositionedSymbol[] = [];
  const memberRoots = new WeakSet<Node>();

  walk(root, (n) => {
    if (n.type === 'Member') {
      const segments: string[] = [n.property];
      let current: Node = n.object;
      while (current.type === 'Member') {
        segments.unshift(current.property);
        current = current.object;
      }
      if (current.type === 'Ident' || current.type === 'NameRef') {
        memberRoots.add(current);
        out.push({
          name: current.name,
          kind: 'member',
          span: n.span,
          fullPath: current.name + '.' + segments.join('.')
        });
      }
    }
  });

  walk(root, (n) => {
    if (n.type === 'Ident') {
      if (memberRoots.has(n)) return;
      out.push({
        name: n.name,
        kind: callees.has(n) ? 'function' : 'variable',
        span: n.span,
        fullPath: n.name
      });
    } else if (n.type === 'NameRef') {
      if (memberRoots.has(n)) return;
      out.push({
        name: n.name,
        kind: 'variable',
        span: n.span,
        fullPath: n.name
      });
    } else if (n.type === 'Unary' && ALPHA_OP_RE.test(n.op)) {
      // Named unary operators like `sin(x)` / `abs(x)` are semantically function
      // calls even though the AST represents them as Unary nodes.
      out.push({
        name: n.op,
        kind: 'function',
        span: { start: n.span.start, end: n.span.start + n.op.length },
        fullPath: n.op
      });
    }
  });

  return out;
}
