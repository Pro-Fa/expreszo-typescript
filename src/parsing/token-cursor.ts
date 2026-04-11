/**
 * Immutable token cursor for the Phase 2 Pratt parser (P2.4). The cursor
 * eagerly drains the legacy `TokenStream` into a `readonly Token[]` at
 * construction and then hands out per-position snapshots via `advance()` —
 * a frozen index into the shared array. Backtracking is a single assignment
 * (`cursor = saved`) instead of the mutable `save()` / `restore()` dance
 * that `parser-state.ts` performs today.
 *
 * Why a wrapper over the existing lexer instead of a rewrite:
 *   - The hand-rolled lexer is 690 lines and handles a lot of quirky cases
 *     (radix integers, named ops, `not in`, unicode multiplication, escape
 *     sequences, arrow-vs-assignment disambiguation). Re-implementing it in
 *     Phase 2 would be a fresh source of regressions with no payoff —
 *     Phase 2's goal is the *parser* side, not the lexer. The lexer rewrite
 *     lives in its own later slot once spans need to be populated.
 *   - Pre-tokenising means the Pratt loop only ever reads from an array
 *     indexed by an integer. Zero hidden state, zero reliance on mutable
 *     fields, zero chance of a parser helper forgetting to `save()` before
 *     a speculative parse.
 *
 * Allocation footprint per `advance()` is three machine words (`tokens`
 * reference is shared, only `index` changes) so the Pratt parser can
 * backtrack freely without worrying about GC pressure. An instance pool
 * would trade correctness-simplicity for negligible speed.
 */
import type { OperatorFunction } from '../types/parser.js';
import { Token, TEOF, TokenType } from './token.js';
import { TokenStream } from './token-stream.js';

/**
 * Minimal parser-shape needed to drive the legacy tokenizer. Re-declared
 * here rather than imported to keep `token-cursor.ts` decoupled from the
 * real `Parser` class (Phase 2.4's Pratt rewrite will want to build cursors
 * from a `defineParser` config without a full `Parser` instance).
 */
interface ParserLike {
  keywords: string[];
  unaryOps: Record<string, OperatorFunction>;
  binaryOps: Record<string, OperatorFunction>;
  ternaryOps: Record<string, OperatorFunction>;
  numericConstants: Record<string, any>;
  buildInLiterals: Record<string, any>;
  options: {
    allowMemberAccess?: boolean;
    operators?: Record<string, any>;
    [key: string]: any;
  };
  isOperatorEnabled(op: string): boolean;
}

/**
 * Position coordinates for error reporting, matching the `Coordinates`
 * shape the legacy `TokenStream.getCoordinates()` returns.
 */
export interface TokenCursorCoordinates {
  readonly line: number;
  readonly column: number;
}

export class TokenCursor {
  private constructor(
    public readonly tokens: readonly Token[],
    public readonly index: number,
    public readonly expression: string
  ) {}

  /**
   * Eagerly drain the expression into a frozen `Token[]` and return a
   * cursor positioned at the first token. Throws the same `ParseError`
   * the legacy `TokenStream` throws on unknown characters — the only
   * behavioural difference is that the error surfaces at cursor creation
   * rather than at the parse step that would have consumed the offending
   * token. That difference is benign: the old lexer was also lazy only in
   * the sense that it didn't *precompute*, not that it allowed a parse to
   * ever succeed past a malformed token.
   */
  static from(parser: ParserLike, expression: string): TokenCursor {
    const stream = new TokenStream(parser, expression);
    const tokens: Token[] = [];
    // `TokenStream.next()` returns a fresh TEOF token forever once the end
    // of the expression is reached, so the first TEOF we see is the
    // terminator and anything beyond that would be a duplicate.
    for (;;) {
      const token = stream.next();
      tokens.push(token);
      if (token.type === TEOF) break;
    }
    return new TokenCursor(tokens, 0, expression);
  }

  /** Return the token at the current cursor position without advancing. */
  peek(): Token {
    return this.tokens[this.index];
  }

  /**
   * Return the token `offset` positions ahead of the cursor. Reads past
   * the end clamp to the final TEOF token so callers can safely look
   * arbitrarily far ahead without bounds-checking.
   */
  peekAt(offset: number): Token {
    const i = this.index + offset;
    if (i >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[i];
  }

  /**
   * Return a new cursor positioned one token ahead. If the cursor already
   * sits on TEOF the same instance is returned — TEOF is the absorbing
   * state of the cursor.
   */
  advance(): TokenCursor {
    if (this.atEnd()) return this;
    return new TokenCursor(this.tokens, this.index + 1, this.expression);
  }

  /** True when the cursor is parked on the terminating TEOF token. */
  atEnd(): boolean {
    return this.peek().type === TEOF;
  }

  /**
   * Shorthand for checking whether the current token is of `type` (and
   * optionally has a matching `value`). Does not advance.
   */
  check(type: TokenType, value?: string): boolean {
    const token = this.peek();
    if (token.type !== type) return false;
    if (value === undefined) return true;
    return token.value === value;
  }

  /**
   * If the current token matches, return a `[token, nextCursor]` pair and
   * advance; otherwise return `null` so the caller can decide whether to
   * try a different rule.
   */
  match(type: TokenType, value?: string): readonly [Token, TokenCursor] | null {
    if (!this.check(type, value)) return null;
    return [this.peek(), this.advance()];
  }

  /**
   * Derive 1-based line/column coordinates for the current cursor position
   * by scanning newline offsets in `expression` up to the current token's
   * index. Matches `TokenStream.getCoordinates()` semantics so error
   * reporting stays consistent across the legacy and Phase 2 parsers.
   */
  getCoordinates(): TokenCursorCoordinates {
    const pos = this.peek().index;
    let line = 0;
    let column = 0;
    let newline = -1;
    do {
      line++;
      column = pos - newline;
      newline = this.expression.indexOf('\n', newline + 1);
    } while (newline >= 0 && newline < pos);
    return { line, column };
  }
}
