import { expect, describe, it } from 'vitest';
import { Parser } from '../../index.js';

describe('Parser.evaluateObject / evaluateArray', () => {
  const parser = new Parser();

  describe('evaluateObject', () => {
    it('resolves string values that reference variables', () => {
      const result = parser.evaluateObject(
        { name: 'user.name', age: 'user.age + 1' },
        { user: { name: 'Jane', age: 29 } }
      );
      expect(result).toEqual({ name: 'Jane', age: 30 });
    });

    it('leaves plain strings unchanged when they do not reference variables', () => {
      const result = parser.evaluateObject(
        { greeting: 'hello world', constant: '2 + 3', label: '42' },
        {}
      );
      expect(result).toEqual({ greeting: 'hello world', constant: '2 + 3', label: '42' });
    });

    it('leaves strings that fail to parse untouched', () => {
      const result = parser.evaluateObject(
        { weird: 'this is not ))) a valid expression' },
        {}
      );
      expect(result).toEqual({ weird: 'this is not ))) a valid expression' });
    });

    it('passes primitives through unchanged', () => {
      const result = parser.evaluateObject(
        { n: 1, b: true, nothing: null, missing: undefined },
        {}
      );
      expect(result).toEqual({ n: 1, b: true, nothing: null, missing: undefined });
    });

    it('recurses into nested objects', () => {
      const result = parser.evaluateObject(
        { outer: { inner: 'x * 2', label: 'static' } },
        { x: 5 }
      );
      expect(result).toEqual({ outer: { inner: 10, label: 'static' } });
    });

    it('recurses into nested arrays', () => {
      const result = parser.evaluateObject(
        { items: ['x', 'x + 1', 'literal'] },
        { x: 10 }
      );
      expect(result).toEqual({ items: [10, 11, 'literal'] });
    });

    it('supports a per-call resolver', () => {
      const result = parser.evaluateObject(
        { name: 'user.name' },
        {},
        (token) =>
          token === 'user' ? { value: { name: 'Jane' } } : undefined
      );
      expect(result).toEqual({ name: 'Jane' });
    });

    it('falls back to the original string when a bareword variable is missing', () => {
      const result = parser.evaluateObject({ status: 'pending' }, {});
      expect(result).toEqual({ status: 'pending' });
    });

    it('returns an empty object for null / undefined input', () => {
      expect(parser.evaluateObject(null as never)).toEqual({});
      expect(parser.evaluateObject(undefined as never)).toEqual({});
    });
  });

  describe('evaluateArray', () => {
    it('resolves string items that reference variables', () => {
      const result = parser.evaluateArray(['x', 'x * 2', 'literal'], { x: 21 });
      expect(result).toEqual([21, 42, 'literal']);
    });

    it('recurses into nested objects and arrays', () => {
      const result = parser.evaluateArray(
        [{ a: 'x' }, ['x + 1', 'static']],
        { x: 4 }
      );
      expect(result).toEqual([{ a: 4 }, [5, 'static']]);
    });

    it('returns an empty array for non-array input', () => {
      expect(parser.evaluateArray('not an array' as never)).toEqual([]);
    });

    it('passes primitives through unchanged', () => {
      const result = parser.evaluateArray([1, true, null, undefined], {});
      expect(result).toEqual([1, true, null, undefined]);
    });
  });
});
