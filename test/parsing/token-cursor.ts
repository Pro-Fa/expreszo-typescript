import { describe, it, expect } from 'vitest';
import { Parser } from '../../index.js';
import { TokenCursor } from '../../src/parsing/token-cursor.js';
import { TokenStream } from '../../src/parsing/token-stream.js';
import { TEOF, TNUMBER, TOP, TNAME, TPAREN } from '../../src/parsing/token.js';

const parser = new Parser();

describe('TokenCursor', () => {
  describe('pre-tokenisation parity with legacy TokenStream', () => {
    const SOURCES = [
      '1 + 2',
      'x + y * z',
      'sin(pi / 2)',
      '(a, b) => a + b',
      'x = 1; y = 2; x + y',
      'case when a > 0 then 1 else -1 end',
      'obj.prop[0]',
      '"hello" | " " | "world"',
      '0xff + 0b1010',
      'not a and b or c',
      'x != y ? "yes" : "no"',
      'a as number + b as string',
      'x ?? y ?? z'
    ];

    it.each(SOURCES)('emits the same (type, value) sequence as TokenStream for %s', (source) => {
      const cursor = TokenCursor.from(parser, source);
      const stream = new TokenStream(parser, source);

      const legacy: Array<{ type: string; value: unknown }> = [];
      for (;;) {
        const t = stream.next();
        legacy.push({ type: t.type, value: t.value });
        if (t.type === TEOF) break;
      }

      const eager: Array<{ type: string; value: unknown }> =
        cursor.tokens.map(t => ({ type: t.type, value: t.value }));

      expect(eager).toEqual(legacy);
    });
  });

  describe('peek / advance', () => {
    it('peek does not advance the cursor', () => {
      const cursor = TokenCursor.from(parser, '1 + 2');
      expect(cursor.peek().value).toBe(1);
      expect(cursor.peek().value).toBe(1);
      expect(cursor.index).toBe(0);
    });

    it('advance returns a new cursor and does not mutate the original', () => {
      const cursor = TokenCursor.from(parser, '1 + 2');
      const next = cursor.advance();
      expect(next).not.toBe(cursor);
      expect(cursor.index).toBe(0);
      expect(next.index).toBe(1);
      expect(cursor.peek().value).toBe(1);
      expect(next.peek().value).toBe('+');
    });

    it('advance walks through the token stream until TEOF', () => {
      const cursor = TokenCursor.from(parser, '1 + 2');
      const values: unknown[] = [];
      let c: TokenCursor = cursor;
      while (!c.atEnd()) {
        values.push(c.peek().value);
        c = c.advance();
      }
      expect(values).toEqual([1, '+', 2]);
      expect(c.peek().type).toBe(TEOF);
    });

    it('advance at TEOF returns the same cursor (absorbing state)', () => {
      const cursor = TokenCursor.from(parser, '1');
      const end = cursor.advance();
      expect(end.atEnd()).toBe(true);
      expect(end.advance()).toBe(end);
    });

    it('peekAt reads arbitrary lookahead and clamps past the end', () => {
      const cursor = TokenCursor.from(parser, '1 + 2');
      expect(cursor.peekAt(0).value).toBe(1);
      expect(cursor.peekAt(1).value).toBe('+');
      expect(cursor.peekAt(2).value).toBe(2);
      expect(cursor.peekAt(3).type).toBe(TEOF);
      expect(cursor.peekAt(99).type).toBe(TEOF);
    });
  });

  describe('check / match', () => {
    it('check matches by type and value without advancing', () => {
      const cursor = TokenCursor.from(parser, '1 + 2');
      expect(cursor.check(TNUMBER)).toBe(true);
      expect(cursor.check(TOP)).toBe(false);
      expect(cursor.check(TNUMBER, '1')).toBe(false);
      expect(cursor.index).toBe(0);
    });

    it('match returns [token, nextCursor] on success and null on miss', () => {
      const cursor = TokenCursor.from(parser, 'foo(42)');
      const hit = cursor.match(TNAME);
      expect(hit).not.toBeNull();
      const [token, next] = hit!;
      expect(token.value).toBe('foo');
      expect(next.peek().value).toBe('(');

      expect(cursor.match(TOP)).toBeNull();
      expect(cursor.index).toBe(0);
    });
  });

  describe('backtracking via reassignment', () => {
    it('saving a cursor, advancing, then reverting restores the position', () => {
      const cursor = TokenCursor.from(parser, '(a, b) => a + b');
      const saved = cursor;
      let c = cursor;
      for (let i = 0; i < 5; i++) c = c.advance();
      expect(c.index).toBe(5);
      // Revert by reassigning to the saved reference — no restore() needed.
      c = saved;
      expect(c.index).toBe(0);
      expect(c.peek().type).toBe(TPAREN);
    });

    it('independent cursors derived from the same origin do not interfere', () => {
      const root = TokenCursor.from(parser, '1 + 2');
      const branchA = root.advance();
      const branchB = root.advance().advance();
      expect(root.index).toBe(0);
      expect(branchA.index).toBe(1);
      expect(branchB.index).toBe(2);
    });
  });

  describe('error reporting coordinates', () => {
    it('getCoordinates matches TokenStream for a single-line expression', () => {
      const source = '   1 + 2';
      const cursor = TokenCursor.from(parser, source);
      // Cursor sits on the `1` at index 3 (1-based column 4).
      expect(cursor.getCoordinates()).toEqual({ line: 1, column: 4 });
    });

    it('getCoordinates reflects newlines in multi-line expressions', () => {
      const source = '1\n+\n2';
      const cursor = TokenCursor.from(parser, source);
      // Walk to the `2` (2 advances past `1` and `+`).
      const atTwo = cursor.advance().advance();
      expect(atTwo.peek().value).toBe(2);
      expect(atTwo.getCoordinates()).toEqual({ line: 3, column: 1 });
    });
  });
});
