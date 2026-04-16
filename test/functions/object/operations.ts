import { describe, it, expect } from 'vitest';
import { merge, keys, values, flatten, pick, omit, mapValues } from '../../../src/functions/object/operations.js';

describe('object/operations', () => {

  // -------------------------------------------------------
  // flatten()
  // -------------------------------------------------------
  describe('flatten()', () => {
    it('returns undefined when obj is undefined', () => {
      expect(flatten(undefined)).toBeUndefined();
    });

    it('throws when first argument is not an object (number)', () => {
      expect(() => flatten(42 as any)).toThrow(/flatten\(\) expects an object as first argument, got number/);
    });

    it('throws when first argument is null', () => {
      expect(() => flatten(null as any)).toThrow(/flatten\(\) expects an object as first argument, got null/);
    });

    it('throws when first argument is an array', () => {
      expect(() => flatten([1, 2] as any)).toThrow(/flatten\(\) expects an object as first argument, got array/);
    });

    it('throws when separator is not a string', () => {
      expect(() => flatten({ a: 1 }, 123 as any)).toThrow(/flatten\(\) expects a string separator as second argument, got number/);
    });

    it('flattens a nested object with default separator', () => {
      const result = flatten({ a: { b: 1, c: 2 }, d: 3 });
      expect(result).toEqual({ a_b: 1, a_c: 2, d: 3 });
    });

    it('flattens deeply nested objects with default separator', () => {
      const result = flatten({ a: { b: { c: { d: 'deep' } } } });
      expect(result).toEqual({ a_b_c_d: 'deep' });
    });

    it('flattens a nested object with custom separator', () => {
      const result = flatten({ a: { b: 1 }, c: { d: 2 } }, '.');
      expect(result).toEqual({ 'a.b': 1, 'c.d': 2 });
    });

    it('preserves arrays as leaf values', () => {
      const result = flatten({ a: { b: [1, 2, 3] } });
      expect(result).toEqual({ a_b: [1, 2, 3] });
    });

    it('preserves null as a leaf value', () => {
      const result = flatten({ a: { b: null } });
      expect(result).toEqual({ a_b: null });
    });

    it('returns a flat copy for an already-flat object', () => {
      const result = flatten({ x: 1, y: 2 });
      expect(result).toEqual({ x: 1, y: 2 });
    });

    it('handles empty nested objects', () => {
      const result = flatten({ a: {} });
      expect(result).toEqual({});
    });

    it('handles mixed nesting depths', () => {
      const result = flatten({ a: 1, b: { c: 2 }, d: { e: { f: 3 } } });
      expect(result).toEqual({ a: 1, b_c: 2, d_e_f: 3 });
    });
  });

  // -------------------------------------------------------
  // pick()
  // -------------------------------------------------------
  describe('pick()', () => {
    it('returns undefined when obj is undefined', () => {
      expect(pick(undefined, ['a'])).toBeUndefined();
    });

    it('returns undefined when keyList is undefined', () => {
      expect(pick({ a: 1 }, undefined)).toBeUndefined();
    });

    it('returns undefined when both arguments are undefined', () => {
      expect(pick(undefined, undefined)).toBeUndefined();
    });

    it('throws when first argument is not an object (string)', () => {
      expect(() => pick('hello' as any, ['a'])).toThrow(/pick\(obj, keys\) expects an object as first argument/);
    });

    it('throws when first argument is null', () => {
      expect(() => pick(null as any, ['a'])).toThrow(/pick\(obj, keys\) expects an object as first argument, got null/);
    });

    it('throws when first argument is an array', () => {
      expect(() => pick([1, 2] as any, ['a'])).toThrow(/pick\(obj, keys\) expects an object as first argument, got array/);
    });

    it('accepts a single string key as convenience form', () => {
      const result = pick({ a: 1, b: 2, c: 3 }, 'b');
      expect(result).toEqual({ b: 2 });
    });

    it('throws when keyList is not an array or string (number)', () => {
      expect(() => pick({ a: 1 }, 42 as any)).toThrow(/pick\(obj, keys\) expects an array of strings as second argument, got number/);
    });

    it('throws when keyList is not an array or string (boolean)', () => {
      expect(() => pick({ a: 1 }, true as any)).toThrow(/pick\(obj, keys\) expects an array of strings as second argument/);
    });

    it('throws when a key in the array is not a string', () => {
      expect(() => pick({ a: 1 }, [1 as any])).toThrow(/pick\(obj, keys\) expects all keys to be strings, got number/);
    });

    it('throws when a key in the array is null', () => {
      expect(() => pick({ a: 1 }, [null as any])).toThrow(/pick\(obj, keys\) expects all keys to be strings, got null/);
    });

    it('skips keys that do not exist on the object', () => {
      const result = pick({ a: 1, b: 2 }, ['a', 'z']);
      expect(result).toEqual({ a: 1 });
    });

    it('returns empty object when no keys match', () => {
      const result = pick({ a: 1 }, ['x', 'y']);
      expect(result).toEqual({});
    });

    it('picks multiple existing keys', () => {
      const result = pick({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'c', 'd']);
      expect(result).toEqual({ a: 1, c: 3, d: 4 });
    });

    it('preserves value types (null, array, nested object)', () => {
      const obj = { a: null, b: [1, 2], c: { nested: true } };
      const result = pick(obj, ['a', 'b', 'c']);
      expect(result).toEqual({ a: null, b: [1, 2], c: { nested: true } });
    });
  });

  // -------------------------------------------------------
  // omit()
  // -------------------------------------------------------
  describe('omit()', () => {
    it('returns undefined when obj is undefined', () => {
      expect(omit(undefined, ['a'])).toBeUndefined();
    });

    it('returns undefined when keyList is undefined', () => {
      expect(omit({ a: 1 }, undefined)).toBeUndefined();
    });

    it('returns undefined when both arguments are undefined', () => {
      expect(omit(undefined, undefined)).toBeUndefined();
    });

    it('throws when first argument is not an object (number)', () => {
      expect(() => omit(99 as any, ['a'])).toThrow(/omit\(obj, keys\) expects an object as first argument, got number/);
    });

    it('throws when first argument is null', () => {
      expect(() => omit(null as any, ['a'])).toThrow(/omit\(obj, keys\) expects an object as first argument, got null/);
    });

    it('throws when first argument is an array', () => {
      expect(() => omit([1] as any, ['a'])).toThrow(/omit\(obj, keys\) expects an object as first argument, got array/);
    });

    it('accepts a single string key as convenience form', () => {
      const result = omit({ a: 1, b: 2, c: 3 }, 'b');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('throws when keyList is not an array or string (number)', () => {
      expect(() => omit({ a: 1 }, 42 as any)).toThrow(/omit\(obj, keys\) expects an array of strings as second argument, got number/);
    });

    it('throws when keyList is not an array or string (boolean)', () => {
      expect(() => omit({ a: 1 }, false as any)).toThrow(/omit\(obj, keys\) expects an array of strings as second argument/);
    });

    it('throws when a key in the array is not a string (number)', () => {
      expect(() => omit({ a: 1 }, [1 as any])).toThrow(/omit\(obj, keys\) expects all keys to be strings, got number/);
    });

    it('throws when a key in the array is null', () => {
      expect(() => omit({ a: 1 }, [null as any])).toThrow(/omit\(obj, keys\) expects all keys to be strings, got null/);
    });

    it('omits specified keys', () => {
      const result = omit({ a: 1, b: 2, c: 3 }, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('omits multiple keys', () => {
      const result = omit({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'c']);
      expect(result).toEqual({ b: 2, d: 4 });
    });

    it('silently ignores keys that do not exist on the object', () => {
      const result = omit({ a: 1, b: 2 }, ['z']);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('returns empty object when all keys are omitted', () => {
      const result = omit({ a: 1, b: 2 }, ['a', 'b']);
      expect(result).toEqual({});
    });
  });

  // -------------------------------------------------------
  // mapValues()
  // -------------------------------------------------------
  describe('mapValues()', () => {
    it('returns undefined when obj is undefined', () => {
      expect(mapValues(undefined, () => 0)).toBeUndefined();
    });

    it('throws when first argument is not an object (string)', () => {
      expect(() => mapValues('hello', () => 0)).toThrow(/mapValues\(\) expects an object as first argument, got string/);
    });

    it('throws when first argument is null', () => {
      expect(() => mapValues(null, () => 0)).toThrow(/mapValues\(\) expects an object as first argument, got null/);
    });

    it('throws when first argument is an array', () => {
      expect(() => mapValues([1, 2], () => 0)).toThrow(/mapValues\(\) expects an object as first argument, got array/);
    });

    it('throws when second argument is not a function (string)', () => {
      expect(() => mapValues({ a: 1 }, 'not a function')).toThrow(/mapValues\(\) expects a function as second argument, got string/);
    });

    it('throws when second argument is not a function (number)', () => {
      expect(() => mapValues({ a: 1 }, 42)).toThrow(/mapValues\(\) expects a function as second argument, got number/);
    });

    it('maps values using the provided function', () => {
      const result = mapValues({ a: 1, b: 2, c: 3 }, (v: number) => v * 2);
      expect(result).toEqual({ a: 2, b: 4, c: 6 });
    });

    it('passes both value and key to the mapping function', () => {
      const result = mapValues({ x: 10, y: 20 }, (value: number, key: string) => `${key}=${value}`);
      expect(result).toEqual({ x: 'x=10', y: 'y=20' });
    });

    it('returns empty object for empty input', () => {
      const result = mapValues({}, (v: any) => v);
      expect(result).toEqual({});
    });
  });

  // -------------------------------------------------------
  // merge() - additional edge-case coverage
  // -------------------------------------------------------
  describe('merge()', () => {
    it('throws when an argument is not an object (number)', () => {
      expect(() => merge(42 as any)).toThrow(/merge\(\) expects objects as arguments, got number/);
    });

    it('throws when an argument is an array', () => {
      expect(() => merge([1] as any)).toThrow(/merge\(\) expects objects as arguments, got array/);
    });

    it('throws when an argument is null', () => {
      expect(() => merge(null as any)).toThrow(/merge\(\) expects objects as arguments, got null/);
    });
  });

  // -------------------------------------------------------
  // keys() - additional edge-case coverage
  // -------------------------------------------------------
  describe('keys()', () => {
    it('throws when argument is not an object (number)', () => {
      expect(() => keys(42 as any)).toThrow(/keys\(\) expects an object, got number/);
    });

    it('throws when argument is null', () => {
      expect(() => keys(null as any)).toThrow(/keys\(\) expects an object, got null/);
    });

    it('throws when argument is an array', () => {
      expect(() => keys([1, 2] as any)).toThrow(/keys\(\) expects an object, got array/);
    });
  });

  // -------------------------------------------------------
  // values() - additional edge-case coverage
  // -------------------------------------------------------
  describe('values()', () => {
    it('throws when argument is not an object (string)', () => {
      expect(() => values('hello' as any)).toThrow(/values\(\) expects an object, got string/);
    });

    it('throws when argument is null', () => {
      expect(() => values(null as any)).toThrow(/values\(\) expects an object, got null/);
    });

    it('throws when argument is an array', () => {
      expect(() => values([1] as any)).toThrow(/values\(\) expects an object, got array/);
    });
  });
});
