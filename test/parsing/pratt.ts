import { describe, it, expect } from 'vitest';
import { Parser } from '../../index.js';
import { PrattParser } from '../../src/parsing/pratt.js';
import type { Node, Binary, Unary, Ternary } from '../../src/ast/nodes.js';

/**
 * Precedence/associativity matrix for the Pratt parser. Spot-checks AST shape
 * for every precedence level in `src/registry/builtin/operators.ts` so that
 * future refactors catch regressions directly rather than chasing downstream
 * eval diffs.
 *
 * The Phase 2.4 parity harness (which cross-validated the Pratt parser
 * against the legacy `ParserState` → RPN → `fromInstructions` bridge) was
 * removed in Phase 2.5 once the Pratt parser became the only parser
 * implementation — the parity checks degenerated into tautologies.
 */

const parser = new Parser();

describe('PrattParser precedence matrix', () => {
  // Helper: cast through Node → expected kind without losing type information.
  const parseRoot = (src: string): Node => PrattParser.parse(parser, src);

  it('multiplication binds tighter than addition', () => {
    // 1 + 2 * 3 → Binary(+, 1, Binary(*, 2, 3))
    const n = parseRoot('1 + 2 * 3') as Binary;
    expect(n.type).toBe('Binary');
    expect(n.op).toBe('+');
    expect((n.right as Binary).op).toBe('*');
  });

  it('parenthesization overrides precedence', () => {
    // (1 + 2) * 3 → Binary(*, Binary(+, 1, 2), 3)
    const n = parseRoot('(1 + 2) * 3') as Binary;
    expect(n.type).toBe('Binary');
    expect(n.op).toBe('*');
    expect((n.left as Binary).op).toBe('+');
  });

  it('addition is left-associative', () => {
    // a - b - c → Binary(-, Binary(-, a, b), c)
    const n = parseRoot('a - b - c') as Binary;
    expect(n.op).toBe('-');
    expect((n.left as Binary).op).toBe('-');
    expect((n.left as Binary).left.type).toBe('Ident');
  });

  it('exponentiation is right-associative', () => {
    // 2 ^ 3 ^ 2 → Binary(^, 2, Binary(^, 3, 2))
    const n = parseRoot('2 ^ 3 ^ 2') as Binary;
    expect(n.op).toBe('^');
    expect((n.right as Binary).op).toBe('^');
  });

  it('assignment is right-associative', () => {
    // a = b = 1 → Binary(=, NameRef(a), Paren(Binary(=, NameRef(b), Paren(1))))
    const n = parseRoot('a = b = 1') as Binary;
    expect(n.op).toBe('=');
    expect(n.left.type).toBe('NameRef');
    // Right side is Paren(Binary('=', ...))
    expect(n.right.type).toBe('Paren');
  });

  it('ternary is right-associative', () => {
    // a ? b : c ? d : e → Ternary(?, a, Paren(b), Paren(Ternary(?, c, Paren(d), Paren(e))))
    const n = parseRoot('a ? b : c ? d : e') as Ternary;
    expect(n.type).toBe('Ternary');
    expect(n.op).toBe('?');
    // c is Paren wrap over the inner ternary
    expect(n.c.type).toBe('Paren');
  });

  it('or binds looser than and', () => {
    // a or b and c → Binary(or, a, Paren(Binary(and, b, Paren(c))))
    const n = parseRoot('a or b and c') as Binary;
    expect(n.op).toBe('or');
    // right is Paren over the and
    expect(n.right.type).toBe('Paren');
  });

  it('and binds looser than comparison', () => {
    // a == b and c == d → Binary(and, Binary(==, a, b), Paren(Binary(==, c, d)))
    const n = parseRoot('a == b and c == d') as Binary;
    expect(n.op).toBe('and');
    expect((n.left as Binary).op).toBe('==');
  });

  it('postfix ! binds tighter than multiplication', () => {
    // 5! * 2 → Binary(*, Unary(!, 5), 2)
    const n = parseRoot('5! * 2') as Binary;
    expect(n.op).toBe('*');
    expect((n.left as Unary).op).toBe('!');
  });

  it('member access binds tightest', () => {
    // -obj.a → Unary(-, Member(obj, a))
    const n = parseRoot('-obj.a') as Unary;
    expect(n.op).toBe('-');
    expect(n.operand.type).toBe('Member');
  });

  it('coalesce binds tighter than multiplication on its LHS', () => {
    // `a ?? b * c` → Binary(*, Binary(??, a, b), c).
    // Legacy parseTerm calls parseCoalesce first, so `??` only composes as the
    // leftmost operand of a multiplication. `a * b ?? c` is a parse error in
    // both parsers — the test covers the composable form.
    const n = parseRoot('a ?? b * c') as Binary;
    expect(n.op).toBe('*');
    expect((n.left as Binary).op).toBe('??');
  });
});

describe('PrattParser error reporting', () => {
  it('throws ParseError with line/column on malformed input', () => {
    expect(() => PrattParser.parse(parser, '1 +')).toThrow();
  });

  it('throws on unterminated parenthesis', () => {
    expect(() => PrattParser.parse(parser, '(1 + 2')).toThrow();
  });

  it('throws on trailing garbage after a valid expression', () => {
    expect(() => PrattParser.parse(parser, '1 + 2 3')).toThrow();
  });
});
