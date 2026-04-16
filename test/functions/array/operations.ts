import { describe, it, expect } from 'vitest';
import {
  flattenArray,
  filter,
  map,
  fold,
  find,
  some,
  every,
  indexOf,
  join,
  sum,
  count,
  unique,
  distinct,
  sort,
  reduce,
} from '../../../src/functions/array/operations.js';

describe('Array Operations', () => {
  describe('flattenArray()', () => {
    it('should return undefined for undefined input', () => {
      expect(flattenArray(undefined)).toBeUndefined();
    });

    it('should flatten a nested array with default infinite depth', () => {
      expect(flattenArray([1, [2, [3]]])).toEqual([1, 2, 3]);
    });

    it('should flatten a nested array with depth = 1', () => {
      expect(flattenArray([1, [2, [3]]], 1)).toEqual([1, 2, [3]]);
    });

    it('should flatten a nested array with depth = 0 (no flattening)', () => {
      expect(flattenArray([1, [2, [3]]], 0)).toEqual([1, [2, [3]]]);
    });

    it('should flatten an already-flat array', () => {
      expect(flattenArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should flatten an object with default separator', () => {
      const result = flattenArray({ a: { b: 1, c: 2 }, d: 3 });
      expect(result).toEqual({ a_b: 1, a_c: 2, d: 3 });
    });

    it('should throw for a string input', () => {
      expect(() => flattenArray('hello')).toThrow(
        /flatten\(\) expects an array or object/
      );
    });

    it('should throw for a numeric input', () => {
      expect(() => flattenArray(42)).toThrow(
        /flatten\(\) expects an array or object/
      );
    });

    it('should throw for a boolean input', () => {
      expect(() => flattenArray(true)).toThrow(
        /flatten\(\) expects an array or object/
      );
    });

    it('should throw when flattening an object with a numeric depth argument', () => {
      expect(() => flattenArray({ a: { b: 1 } }, 2)).toThrow(
        'flatten() with a depth argument is only supported for arrays.'
      );
    });

    it('should throw when flattening an object with depth = 0', () => {
      expect(() => flattenArray({ a: 1 }, 0)).toThrow(
        'flatten() with a depth argument is only supported for arrays.'
      );
    });
  });

  describe('filter()', () => {
    it('should return undefined for undefined input', () => {
      expect(filter(undefined, undefined)).toBeUndefined();
    });

    it('should filter array-first with array and predicate', () => {
      const result = filter([1, 2, 3, 4], (x: number) => x > 2);
      expect(result).toEqual([3, 4]);
    });

    it('should filter function-first with predicate and array', () => {
      const result = filter((x: number) => x > 2, [1, 2, 3, 4]);
      expect(result).toEqual([3, 4]);
    });

    it('should return undefined when function-first with undefined array', () => {
      const result = filter((x: number) => x > 2, undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('map()', () => {
    it('should return undefined for undefined input', () => {
      expect(map(undefined, undefined)).toBeUndefined();
    });

    it('should map array-first', () => {
      expect(map([1, 2, 3], (x: number) => x * 2)).toEqual([2, 4, 6]);
    });

    it('should map function-first', () => {
      expect(map((x: number) => x * 2, [1, 2, 3])).toEqual([2, 4, 6]);
    });

    it('should return undefined when function-first with undefined array', () => {
      expect(map((x: number) => x * 2, undefined)).toBeUndefined();
    });
  });

  describe('fold()', () => {
    it('should return undefined for undefined first argument', () => {
      expect(fold(undefined, 0, undefined)).toBeUndefined();
    });

    it('should fold array-first', () => {
      expect(fold([1, 2, 3], 0, (acc: number, x: number) => acc + x)).toBe(6);
    });

    it('should fold function-first', () => {
      expect(fold((acc: number, x: number) => acc + x, 0, [1, 2, 3])).toBe(6);
    });

    it('should return undefined when function-first with undefined array', () => {
      expect(fold((acc: number, x: number) => acc + x, 0, undefined)).toBeUndefined();
    });

    it('should return undefined when third arg is undefined and first arg is not array/function', () => {
      expect(fold([1, 2], 0, undefined)).toBeUndefined();
    });
  });

  describe('reduce()', () => {
    it('should behave as an alias for fold', () => {
      expect(reduce([1, 2, 3], 0, (acc: number, x: number) => acc + x)).toBe(6);
    });
  });

  describe('find()', () => {
    it('should return undefined for undefined input', () => {
      expect(find(undefined, undefined)).toBeUndefined();
    });

    it('should find array-first', () => {
      expect(find([1, 2, 3, 4], (x: number) => x > 2)).toBe(3);
    });

    it('should find function-first', () => {
      expect(find((x: number) => x > 2, [1, 2, 3, 4])).toBe(3);
    });

    it('should return undefined when nothing matches', () => {
      expect(find([1, 2, 3], (x: number) => x > 10)).toBeUndefined();
    });

    it('should return undefined when function-first with undefined array', () => {
      expect(find((x: number) => x > 2, undefined)).toBeUndefined();
    });
  });

  describe('some()', () => {
    it('should return undefined for undefined input', () => {
      expect(some(undefined, undefined)).toBeUndefined();
    });

    it('should return true when predicate matches some elements', () => {
      expect(some([1, 2, 3], (x: number) => x > 2)).toBe(true);
    });

    it('should return false when predicate matches no elements', () => {
      expect(some([1, 2, 3], (x: number) => x > 10)).toBe(false);
    });

    it('should return undefined when function-first with undefined array', () => {
      expect(some((x: number) => x > 2, undefined)).toBeUndefined();
    });
  });

  describe('every()', () => {
    it('should return undefined for undefined input', () => {
      expect(every(undefined, undefined)).toBeUndefined();
    });

    it('should return true when predicate matches all elements', () => {
      expect(every([1, 2, 3], (x: number) => x > 0)).toBe(true);
    });

    it('should return false when predicate fails for some elements', () => {
      expect(every([1, 2, 3], (x: number) => x > 2)).toBe(false);
    });

    it('should return undefined when function-first with undefined array', () => {
      expect(every((x: number) => x > 0, undefined)).toBeUndefined();
    });
  });

  describe('indexOf()', () => {
    it('should return undefined for undefined input', () => {
      expect(indexOf(undefined, 'a')).toBeUndefined();
    });

    it('should find index in array', () => {
      expect(indexOf(['a', 'b', 'c'], 'b')).toBe(1);
    });

    it('should find index in string', () => {
      expect(indexOf('hello', 'l')).toBe(2);
    });

    it('should return -1 when not found', () => {
      expect(indexOf(['a', 'b'], 'z')).toBe(-1);
    });
  });

  describe('join()', () => {
    it('should return undefined when array is undefined', () => {
      expect(join(undefined, ',')).toBeUndefined();
    });

    it('should return undefined when separator is undefined', () => {
      expect(join(['a', 'b'], undefined)).toBeUndefined();
    });

    it('should join array elements', () => {
      expect(join(['a', 'b', 'c'], ', ')).toBe('a, b, c');
    });
  });

  describe('sum()', () => {
    it('should return undefined for undefined input', () => {
      expect(sum(undefined)).toBeUndefined();
    });

    it('should sum numeric array', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
    });

    it('should return undefined if any element is undefined', () => {
      expect(sum([1, undefined, 3])).toBeUndefined();
    });
  });

  describe('count()', () => {
    it('should return undefined for undefined input', () => {
      expect(count(undefined)).toBeUndefined();
    });

    it('should count array elements', () => {
      expect(count([1, 2, 3])).toBe(3);
    });

    it('should count empty array', () => {
      expect(count([])).toBe(0);
    });
  });

  describe('unique()', () => {
    it('should return undefined for undefined input', () => {
      expect(unique(undefined)).toBeUndefined();
    });

    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should return empty array for empty input', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('distinct()', () => {
    it('should behave as an alias for unique', () => {
      expect(distinct([1, 1, 2])).toEqual([1, 2]);
    });

    it('should return undefined for undefined input', () => {
      expect(distinct(undefined)).toBeUndefined();
    });
  });

  describe('sort()', () => {
    it('should return undefined for undefined input', () => {
      expect(sort(undefined)).toBeUndefined();
    });

    it('should sort array in natural order', () => {
      expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
    });

    it('should sort with a custom comparator (array-first)', () => {
      expect(sort([3, 1, 2], (a: number, b: number) => b - a)).toEqual([3, 2, 1]);
    });

    it('should sort with a custom comparator (function-first)', () => {
      expect(sort((a: number, b: number) => b - a, [3, 1, 2])).toEqual([3, 2, 1]);
    });

    it('should not mutate the original array', () => {
      const original = [3, 1, 2];
      sort(original);
      expect(original).toEqual([3, 1, 2]);
    });
  });
});
