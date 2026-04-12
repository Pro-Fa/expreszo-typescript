/**
 * Pratt-style AST-emitting parser for v7 (Phase 2.4).
 *
 * Direct structural translation of the legacy `src/parsing/parser-state.ts`
 * recursive-descent cascade, with two key differences:
 *
 *   1. Emits `src/ast/nodes.ts` AST nodes instead of RPN `Instruction[]`.
 *   2. Uses the immutable `TokenCursor` (P2.3) for state. "Save/restore"
 *      around speculative parses (arrow functions) is just local variable
 *      assignment — no mutable `save()` / `restore()` dance.
 *
 * Byte-for-byte parity with the legacy path is preserved at the level of
 * `nodeToString(prattParse(src))` vs `nodeToString(fromInstructions(legacyParser.parse(src).tokens))`
 * — this parser wraps sub-expressions in `Paren` nodes at the exact same
 * positions the legacy lexer emits `IEXPR` instructions:
 *
 *   - Assignment RHS:           `x = <Paren(value)>`
 *   - Function definition body: `f(a) = <Paren(body)>`
 *   - Ternary branches:         `c ? <Paren(a)> : <Paren(b)>`
 *   - `and` / `or` RHS:         `x and <Paren(y)>`, `x or <Paren(y)>`
 *   - Arrow function body:      `params => <Paren(body)>`
 *   - Statement termination:    a `parseExpression` call that encounters at
 *                               least one `;` wraps its cumulative output in
 *                               `Paren(Sequence(...))`.
 *
 * Phase 2.5 flips `Expression` to hold this parser's output as its primary IR;
 * Phase 2.6 deletes the legacy RPN parser and its utility classes.
 */
import { TokenCursor } from './token-cursor.js';
import {
  TEOF, TOP, TNUMBER, TSTRING, TCONST, TPAREN, TBRACKET, TCOMMA, TNAME,
  TSEMICOLON, TKEYWORD, TBRACE, Token, TokenType
} from './token.js';
import {
  type Node, type CaseArm, type ObjectProperty,
  mkNumber, mkString, mkBool, mkNull, mkUndefined, mkRaw,
  mkArray, mkObject, mkIdent, mkNameRef, mkMember,
  mkUnary, mkBinary, mkTernary, mkCall, mkLambda, mkFunctionDef,
  mkCase, mkSequence, mkParen
} from '../ast/nodes.js';
import { ParseError, AccessError } from '../types/errors.js';
import type { OperatorFunction } from '../types/parser.js';

/**
 * Minimal parser shape the Pratt loop consumes. Re-declared here to keep the
 * Phase 2 parser decoupled from the legacy `Parser` class — the Phase 4
 * `defineParser` factory will supply its own instance that satisfies this
 * interface without carrying the legacy constructor-time wiring.
 */
interface ParserLike {
  keywords: string[];
  unaryOps: Record<string, OperatorFunction>;
  binaryOps: Record<string, OperatorFunction>;
  ternaryOps: Record<string, OperatorFunction>;
  functions: Record<string, OperatorFunction>;
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
 * Sentinel node pushed into an `exprInstr`-style accumulator to mark a
 * `;` statement boundary. Stripped when the accumulator is finalized into
 * a Sequence/Paren — never leaks into the resulting AST.
 */
const END_STATEMENT_SYMBOL = Symbol('__pratt_end_statement__');
const END_STATEMENT_SENTINEL: Node = {
  type: 'RawLit',
  value: END_STATEMENT_SYMBOL,
  span: { start: -1, end: -1 }
};

function isEndStatement(n: Node): boolean {
  return n.type === 'RawLit' && n.value === END_STATEMENT_SYMBOL;
}

/** Build a Sequence (or a single node) from an accumulator that may contain END_STATEMENT sentinels. */
function buildFromInstr(instr: Node[]): Node {
  // Mirrors the legacy `fromInstructions` handling of IENDSTATEMENT: each
  // sentinel flushes any accumulated nodes as one statement; nodes between
  // sentinels are grouped as a Sequence when there is more than one.
  const statements: Node[] = [];
  let accum: Node[] = [];
  const flushAccum = (): void => {
    if (accum.length === 0) return;
    if (accum.length === 1) {
      statements.push(accum[0]);
    } else {
      // Multiple nodes without a separating sentinel — wrap as a Sequence
      // so the caller still sees a single root. This matches the legacy
      // `flushStatement` behavior at the tail of the instruction stream.
      statements.push(mkSequence(accum));
    }
    accum = [];
  };
  for (const n of instr) {
    if (isEndStatement(n)) {
      flushAccum();
    } else {
      accum.push(n);
    }
  }
  flushAccum();
  if (statements.length === 0) return mkUndefined();
  if (statements.length === 1) return statements[0];
  return mkSequence(statements);
}

export class PrattParser {
  private static readonly MAX_DEPTH = 256;
  private cursor: TokenCursor;
  private readonly allowMemberAccess: boolean;
  private depth = 0;

  private constructor(private readonly parser: ParserLike, cursor: TokenCursor) {
    this.cursor = cursor;
    this.allowMemberAccess = parser.options.allowMemberAccess !== false;
  }

  private enterRecursion(): void {
    if (++this.depth > PrattParser.MAX_DEPTH) {
      this.error('Expression nesting exceeds maximum depth');
    }
  }

  /** Parse `expression` to an AST root node. Throws `ParseError` on failure. */
  static parse(parser: ParserLike, expression: string): Node {
    const cursor = TokenCursor.from(parser, expression);
    const p = new PrattParser(parser, cursor);
    const node = p.parseExpression();
    if (!p.cursor.atEnd()) {
      p.error('Expected EOF');
    }
    return node;
  }

  // --- Cursor helpers ------------------------------------------------------

  private peek(): Token { return this.cursor.peek(); }
  private peekAt(offset: number): Token { return this.cursor.peekAt(offset); }
  private atEnd(): boolean { return this.cursor.atEnd(); }

  private check(
    type: TokenType,
    value?: string | Set<string> | readonly string[] | ((t: Token) => boolean)
  ): boolean {
    const t = this.peek();
    if (t.type !== type) return false;
    if (value === undefined) return true;
    if (typeof value === 'function') return value(t);
    if (value instanceof Set) return value.has(t.value as string);
    if (Array.isArray(value)) return value.includes(t.value as string);
    return t.value === value;
  }

  private accept(
    type: TokenType,
    value?: string | Set<string> | readonly string[] | ((t: Token) => boolean),
    exclude?: readonly string[]
  ): boolean {
    const t = this.peek();
    if (t.type !== type) return false;
    if (exclude && exclude.includes(t.value as string)) return false;
    if (value !== undefined) {
      if (typeof value === 'function') {
        if (!value(t)) return false;
      } else if (value instanceof Set) {
        if (!value.has(t.value as string)) return false;
      } else if (Array.isArray(value)) {
        if (!value.includes(t.value as string)) return false;
      } else if (t.value !== value) {
        return false;
      }
    }
    this.cursor = this.cursor.advance();
    return true;
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (this.accept(type, value)) return t;
    this.error(`Expected ${value || type}`);
  }

  private error(msg: string): never {
    const coords = this.cursor.getCoordinates();
    throw new ParseError(msg, {
      position: { line: coords.line, column: coords.column },
      token: this.peek()?.value?.toString(),
      expression: this.cursor.expression
    });
  }

  private isPrefixOperator(token: Token): boolean {
    return token.type === TOP && (token.value as string) in this.parser.unaryOps;
  }

  // --- parseExpression: top-level with statement termination --------------

  /**
   * Top-level expression parser. Returns a single AST node representing the
   * parsed source. Encountering at least one `;` wraps the cumulative output
   * in `Paren(Sequence(...))` to match the legacy `IEXPR` wrapping at
   * statement termination.
   */
  parseExpression(): Node {
    this.enterRecursion();
    const exprInstr: Node[] = [];

    // Mirror legacy parseExpression: first attempt to consume a leading `;`.
    // This is a rare edge case (an empty leading statement) but we preserve
    // the behavior for parity.
    if (this.parseUntilEndStatement(exprInstr)) {
      this.depth--;
      return this.finalizeStatements(exprInstr);
    }

    const first = this.parseVariableAssignmentExpression();
    exprInstr.push(first);

    if (this.parseUntilEndStatement(exprInstr)) {
      this.depth--;
      return this.finalizeStatements(exprInstr);
    }

    // No `;` seen — return the single expression directly (no Paren wrap).
    this.depth--;
    return first;
  }

  /**
   * Wrap an accumulator into a `Paren(<Sequence|single>)` node. Matches the
   * legacy IEXPR wrap performed by `processStatementTermination`.
   */
  private finalizeStatements(exprInstr: Node[]): Node {
    return mkParen(buildFromInstr(exprInstr));
  }

  /**
   * Consume a `;` and (recursively) the remainder of the expression. Returns
   * `true` if a `;` was consumed. Mirrors legacy `parseUntilEndStatement`.
   */
  private parseUntilEndStatement(exprInstr: Node[]): boolean {
    if (!this.accept(TSEMICOLON)) return false;

    // shouldAddEndStatement: next is not EOF and not `)`.
    if (this.shouldAddEndStatement()) {
      exprInstr.push(END_STATEMENT_SENTINEL);
    }

    // Continue parsing if there are more tokens.
    if (!this.atEnd()) {
      // Legacy recurses into parseExpression which pushes into the same
      // exprInstr array. Our parseExpression returns a single Node — either
      // unwrapped (no `;` seen by the recursion) or Paren-wrapped (`;` seen).
      // Both cases push as a single accumulator entry.
      const inner = this.parseExpression();
      exprInstr.push(inner);
    }

    // Second shouldAddEndStatement check — mirrors processStatementTermination.
    // Hits when parseExpression was called in a context that allows stopping
    // at `,` (argument lists, array elements).
    if (this.shouldAddEndStatement()) {
      exprInstr.push(END_STATEMENT_SENTINEL);
    }

    return true;
  }

  private shouldAddEndStatement(): boolean {
    const t = this.peek();
    if (t.type === TEOF) return false;
    if (t.type === TPAREN && t.value === ')') return false;
    return true;
  }

  // --- Assignment ----------------------------------------------------------

  private parseVariableAssignmentExpression(): Node {
    this.enterRecursion();
    let left = this.parseConditionalExpression();

    while (this.accept(TOP, '=')) {
      // `=` is right-associative. Right-hand side is itself a full assignment
      // expression, then wrapped in Paren to mirror the legacy IEXPR wrap.
      const rhs = this.parseVariableAssignmentExpression();
      const wrappedRhs = mkParen(rhs);

      if (left.type === 'Call') {
        // Function definition: `f(a, b) = body`
        if (!this.parser.isOperatorEnabled('()=')) {
          this.error('function definition is not permitted');
        }
        if (left.callee.type !== 'Ident') {
          throw new Error('expected variable for assignment');
        }
        const params: string[] = [];
        for (const arg of left.args) {
          if (arg.type !== 'Ident') {
            throw new Error('expected variable for assignment');
          }
          params.push(arg.name);
        }
        left = mkFunctionDef(left.callee.name, params, wrappedRhs);
      } else if (left.type === 'Ident') {
        left = mkBinary('=', mkNameRef(left.name), wrappedRhs);
      } else if (left.type === 'Member') {
        // Legacy emits a malformed sequence for member assignment (IVAR(obj)
        // still on stack, IVARNAME(property), IEXPR(value), `=`). Matching it
        // in AST form would require a dangling sibling node which breaks the
        // single-root invariant. We replicate the user-visible behavior:
        // produce `Binary('=', NameRef(property), Paren(value))` and surface
        // the object as a prior sibling via a Sequence. This is rare enough
        // that the Phase 3 evaluator can diagnose it cleanly later.
        left = mkSequence([
          left.object,
          mkBinary('=', mkNameRef(left.property), wrappedRhs)
        ]);
      } else {
        throw new Error('expected variable for assignment');
      }
    }

    this.depth--;
    return left;
  }

  // --- Conditional / ternary ----------------------------------------------

  private parseConditionalExpression(): Node {
    this.enterRecursion();
    let expr = this.parseOrExpression();

    while (this.accept(TOP, '?')) {
      const trueBranch = this.parseConditionalExpression();
      this.expect(TOP, ':');
      const falseBranch = this.parseConditionalExpression();
      expr = mkTernary('?', expr, mkParen(trueBranch), mkParen(falseBranch));
    }

    this.depth--;
    return expr;
  }

  // --- or / and (short-circuit, RHS wrapped in Paren) ---------------------

  private parseOrExpression(): Node {
    let left = this.parseAndExpression();
    while (this.check(TOP, 'or') || this.check(TOP, '||')) {
      const op = this.peek().value as string;
      this.cursor = this.cursor.advance();
      const right = this.parseAndExpression();
      left = mkBinary(op, left, mkParen(right));
    }
    return left;
  }

  private parseAndExpression(): Node {
    let left = this.parseComparison();
    while (this.check(TOP, 'and') || this.check(TOP, '&&')) {
      const op = this.peek().value as string;
      this.cursor = this.cursor.advance();
      const right = this.parseComparison();
      left = mkBinary(op, left, mkParen(right));
    }
    return left;
  }

  // --- Comparison / AddSub / MulDiv / Coalesce ----------------------------

  private static readonly COMPARISON_OPERATORS = new Set(
    ['==', '!=', '<', '<=', '>=', '>', 'in', 'not in']);

  private parseComparison(): Node {
    let left = this.parseAddSub();
    while (this.check(TOP, PrattParser.COMPARISON_OPERATORS)) {
      const op = this.peek().value as string;
      this.cursor = this.cursor.advance();
      const right = this.parseAddSub();
      left = mkBinary(op, left, right);
    }
    return left;
  }

  private static readonly ADD_SUB_OPERATORS = new Set(['+', '-', '|']);

  private parseAddSub(): Node {
    let left = this.parseTerm();
    while (true) {
      const t = this.peek();
      if (t.type !== TOP) break;
      const v = t.value as string;
      if (!PrattParser.ADD_SUB_OPERATORS.has(v)) break;
      if (v === '||') break; // exclude: `||` is handled by parseOrExpression
      this.cursor = this.cursor.advance();
      const right = this.parseTerm();
      left = mkBinary(v, left, right);
    }
    return left;
  }

  private static readonly TERM_OPERATORS = new Set(['*', '/', '%']);

  private parseTerm(): Node {
    let left = this.parseCoalesceExpression();
    while (this.check(TOP, PrattParser.TERM_OPERATORS)) {
      const op = this.peek().value as string;
      this.cursor = this.cursor.advance();
      const right = this.parseFactor();
      left = mkBinary(op, left, right);
    }
    return left;
  }

  private static readonly COALESCE_OPERATORS = new Set(['??', 'as']);

  private parseCoalesceExpression(): Node {
    let left = this.parseFactor();
    while (this.check(TOP, PrattParser.COALESCE_OPERATORS)) {
      const op = this.peek().value as string;
      this.cursor = this.cursor.advance();
      const right = this.parseFactor();
      left = mkBinary(op, left, right);
    }
    return left;
  }

  // --- Factor (prefix unary with the weird parseFactor save/restore) ------

  private parseFactor(): Node {
    this.enterRecursion();
    const saved = this.cursor;
    const t = this.peek();

    if (t.type === TOP && this.isPrefixOperator(t)) {
      // Speculatively consume the prefix op and look at the next token.
      this.cursor = this.cursor.advance();
      const v = t.value as string;
      if (v !== '-' && v !== '+') {
        const next = this.peek();
        if (next.type === TPAREN && next.value === '(') {
          // `sin(x)` — treat `sin` as a function call target, not a prefix.
          // Restore and fall through to the normal expression path.
          this.cursor = saved;
          this.depth--;
          return this.parseExponential();
        }
        if (
          next.type === TSEMICOLON || next.type === TCOMMA || next.type === TEOF ||
          (next.type === TPAREN && next.value === ')')
        ) {
          // Bare identifier like `sin;` — parse as atom, not a prefix.
          this.cursor = saved;
          this.depth--;
          return this.parseAtom();
        }
      }
      // Genuine prefix unary: recurse right-associatively.
      const operand = this.parseFactor();
      this.depth--;
      return mkUnary(v, operand);
    }

    this.depth--;
    return this.parseExponential();
  }

  // --- Exponential (right-associative `^`) --------------------------------

  private parseExponential(): Node {
    let left = this.parsePostfixExpression();
    while (this.accept(TOP, '^')) {
      const right = this.parseFactor();
      left = mkBinary('^', left, right);
    }
    return left;
  }

  // --- Postfix `!` --------------------------------------------------------

  private parsePostfixExpression(): Node {
    let expr = this.parseFunctionCall();
    while (this.accept(TOP, '!')) {
      expr = mkUnary('!', expr);
    }
    return expr;
  }

  // --- Function call ------------------------------------------------------

  private parseFunctionCall(): Node {
    const t = this.peek();
    if (t.type === TOP && this.isPrefixOperator(t)) {
      // `sin(x)` (restored-path): `sin` is a prefix op; consume it and parse
      // the operand as an atom, emitting a unary. Matches legacy behavior.
      this.cursor = this.cursor.advance();
      const operand = this.parseAtom();
      return mkUnary(t.value as string, operand);
    }

    let expr = this.parseMemberExpression();

    while (this.accept(TPAREN, '(')) {
      const args: Node[] = [];
      if (!this.check(TPAREN, ')')) {
        args.push(this.parseExpression());
        while (this.accept(TCOMMA)) {
          args.push(this.parseExpression());
        }
      }
      this.expect(TPAREN, ')');
      expr = mkCall(expr, args);
    }

    return expr;
  }

  // --- Member access (`.` and `[`) ---------------------------------------

  private parseMemberExpression(): Node {
    let expr = this.parseAtom();

    while (true) {
      if (this.accept(TOP, '.')) {
        if (!this.allowMemberAccess) {
          throw new AccessError('member access is not permitted', {
            expression: this.cursor.expression
          });
        }
        const name = this.expect(TNAME);
        expr = mkMember(expr, String(name.value));
      } else if (this.accept(TBRACKET, '[')) {
        if (!this.parser.isOperatorEnabled('[')) {
          throw new AccessError('Array access is disabled', {
            expression: this.cursor.expression
          });
        }
        const index = this.parseExpression();
        this.expect(TBRACKET, ']');
        expr = mkBinary('[', expr, index);
      } else {
        break;
      }
    }

    return expr;
  }

  // --- Atom ---------------------------------------------------------------

  private parseAtom(): Node {
    const t = this.peek();

    // Names and prefix-op identifiers (with arrow-function lookahead).
    if (t.type === TNAME || (t.type === TOP && this.isPrefixOperator(t))) {
      this.cursor = this.cursor.advance();

      if (t.value === 'undefined') {
        return mkUndefined();
      }

      // Single-parameter arrow function: `x => expr`
      const next = this.peek();
      if (next.type === TOP && next.value === '=>') {
        return this.parseArrowFunctionFromParameter(String(t.value));
      }

      return mkIdent(String(t.value));
    }

    // Numeric/string/constant literals.
    if (t.type === TNUMBER) {
      this.cursor = this.cursor.advance();
      return mkNumber(t.value as number);
    }
    if (t.type === TSTRING) {
      this.cursor = this.cursor.advance();
      return mkString(t.value as string);
    }
    if (t.type === TCONST) {
      this.cursor = this.cursor.advance();
      const v = t.value;
      if (typeof v === 'number') return mkNumber(v);
      if (typeof v === 'string') return mkString(v);
      if (typeof v === 'boolean') return mkBool(v);
      if (v === null) return mkNull();
      if (v === undefined) return mkUndefined();
      return mkRaw(v);
    }

    // Parenthesized expression or multi-parameter arrow function.
    if (this.accept(TPAREN, '(')) {
      // Try arrow function first; on failure, restore and parse as a regular
      // parenthesized expression.
      const arrow = this.tryParseArrowFunction();
      if (arrow !== null) return arrow;

      const inner = this.parseExpression();
      this.expect(TPAREN, ')');
      return inner;
    }

    // Object literal.
    if (this.accept(TBRACE, '{')) {
      return this.parseObjectLiteral();
    }

    // Array literal. Mirror the legacy `parseArrayList` loop so an unclosed
    // `[` surfaces as "Unexpected token: TEOF" from the recursive atom parse
    // rather than "Expected ]" from a direct `expect` call — matches legacy
    // error messages the language service's diagnostics assertions depend on.
    if (this.accept(TBRACKET, '[')) {
      const elements: Node[] = [];
      while (!this.accept(TBRACKET, ']')) {
        elements.push(this.parseExpression());
        while (this.accept(TCOMMA)) {
          elements.push(this.parseExpression());
        }
      }
      return mkArray(elements);
    }

    // Keyword expression (case/when).
    if (this.accept(TKEYWORD)) {
      return this.parseKeywordExpression(t);
    }

    this.error(`Unexpected token: ${t}`);
  }

  // --- Arrow functions ----------------------------------------------------

  /**
   * Parse `paramName => body` when we've just consumed `paramName`. Mirrors
   * legacy `parseArrowFunctionFromParameter`.
   */
  private parseArrowFunctionFromParameter(paramName: string): Node {
    if (!this.parser.isOperatorEnabled('=>')) {
      this.error('Arrow function syntax is not permitted');
    }
    this.expect(TOP, '=>');
    // Arrow bodies are conditional expressions, not full expressions — a
    // trailing `;` terminates the arrow rather than joining into the body.
    const body = this.parseConditionalExpression();
    return mkLambda([paramName], mkParen(body));
  }

  /**
   * Speculatively parse `(p1, p2, ...) => body`. Called after the initial
   * `(` has been consumed. On failure, restores the cursor and returns `null`.
   */
  private tryParseArrowFunction(): Node | null {
    const saved = this.cursor;
    // At this point `(` has been consumed. Restoring to `saved` restores the
    // state just past the `(`, so the caller's recovery path (parseExpression
    // inside `(...)`) still works.

    // Empty parameter list: `() => body`
    if (this.accept(TPAREN, ')')) {
      if (!this.accept(TOP, '=>')) {
        this.cursor = saved;
        return null;
      }
      if (!this.parser.isOperatorEnabled('=>')) {
        // Legacy `tryParseArrowFunction` simply restores and returns false on
        // the empty-param path; the outer fallback then throws an expected
        // parse error. We do the same.
        this.cursor = saved;
        return null;
      }
      const body = this.parseExpression();
      return mkLambda([], mkParen(body));
    }

    const params: string[] = [];
    if (!this.check(TNAME)) {
      this.cursor = saved;
      return null;
    }
    params.push(String(this.peek().value));
    this.cursor = this.cursor.advance();

    while (this.accept(TCOMMA)) {
      if (!this.check(TNAME)) {
        this.cursor = saved;
        return null;
      }
      params.push(String(this.peek().value));
      this.cursor = this.cursor.advance();
    }

    if (!this.accept(TPAREN, ')')) {
      this.cursor = saved;
      return null;
    }

    if (!this.accept(TOP, '=>')) {
      this.cursor = saved;
      return null;
    }

    if (!this.parser.isOperatorEnabled('=>')) {
      this.error('Arrow function syntax is not permitted');
    }

    // Arrow function bodies stop at `;` — use parseConditionalExpression.
    const body = this.parseConditionalExpression();
    return mkLambda(params, mkParen(body));
  }

  // --- Case / when --------------------------------------------------------

  private parseKeywordExpression(keyword: Token): Node {
    if (keyword.value === 'case') {
      return this.parseCaseWhen();
    }
    throw new Error(`unexpected keyword: ${keyword.value}`);
  }

  private parseCaseWhen(): Node {
    // Distinguish `case subject when ... end` from `case when ... end`.
    const caseWithInput = !this.check(TKEYWORD);
    let subject: Node | null = null;
    if (caseWithInput) {
      subject = this.parseConditionalExpression();
    }

    const arms: CaseArm[] = [];
    let elseNode: Node | null = null;

    while (this.accept(TKEYWORD, 'when')) {
      const when = this.parseConditionalExpression();
      if (!this.accept(TKEYWORD, 'then')) {
        throw new Error('case block missing when');
      }
      const then = this.parseConditionalExpression();
      arms.push({ when, then });
    }

    if (this.accept(TKEYWORD, 'else')) {
      elseNode = this.parseConditionalExpression();
    }

    if (!this.accept(TKEYWORD, 'end')) {
      throw new Error('invalid case block');
    }

    return mkCase(subject, arms, elseNode);
  }

  // --- Object literal -----------------------------------------------------

  private parseObjectLiteral(): Node {
    const properties: ObjectProperty[] = [];

    if (this.accept(TBRACE, '}')) {
      return mkObject(properties);
    }

    for (let first = true; ; first = false) {
      if (!first) {
        if (!this.accept(TCOMMA)) {
          throw new Error('invalid object definition');
        }
        // Trailing comma.
        if (this.accept(TBRACE, '}')) {
          return mkObject(properties);
        }
      }

      const nameToken = this.peek();
      if (!this.accept(TNAME)) {
        throw new Error('invalid object definition');
      }
      if (!this.accept(TOP, ':')) {
        throw new Error('invalid object definition');
      }
      const value = this.parseExpression();
      properties.push({ key: String(nameToken.value), value });

      if (this.accept(TBRACE, '}')) {
        return mkObject(properties);
      }
    }
  }
}

/** Convenience entry point. Returns the parsed AST root for `source`. */
export function parseToAst(parser: ParserLike, source: string): Node {
  return PrattParser.parse(parser, source);
}
