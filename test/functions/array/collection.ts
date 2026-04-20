import { describe, it, expect } from 'vitest';
import {
  range,
  chunk,
  union,
  intersect,
  groupBy,
  countBy
} from '../../../src/functions/array/collection.js';

describe('range', () => {
  it('generates an ascending sequence with default step', () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('generates an ascending sequence with custom step', () => {
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
  });

  it('generates a descending sequence with negative step', () => {
    expect(range(10, 0, -2)).toEqual([10, 8, 6, 4, 2]);
  });

  it('returns empty array when start equals end', () => {
    expect(range(5, 5)).toEqual([]);
  });

  it('returns empty array on direction mismatch (positive step, start > end)', () => {
    expect(range(5, 0)).toEqual([]);
  });

  it('returns empty array on direction mismatch (negative step, start < end)', () => {
    expect(range(0, 5, -1)).toEqual([]);
  });

  it('returns undefined when start is undefined', () => {
    expect(range(undefined, 5)).toBeUndefined();
  });

  it('returns undefined when end is undefined', () => {
    expect(range(0, undefined)).toBeUndefined();
  });

  it('throws when start is not a number', () => {
    expect(() => range('a' as any, 5)).toThrow(/range/);
  });

  it('throws when end is not a number', () => {
    expect(() => range(0, 'b' as any)).toThrow(/range/);
  });

  it('throws when step is not a number', () => {
    expect(() => range(0, 5, 'x' as any)).toThrow(/step/);
  });

  it('throws when step is zero', () => {
    expect(() => range(0, 5, 0)).toThrow(/step/);
  });

  it('throws when step is Infinity', () => {
    expect(() => range(0, 5, Infinity)).toThrow(/step/);
  });

  it('throws when step is -Infinity', () => {
    expect(() => range(0, 5, -Infinity)).toThrow(/step/);
  });

  it('throws when step is NaN', () => {
    expect(() => range(0, 5, NaN)).toThrow(/step/);
  });
});

describe('chunk', () => {
  it('splits into equal-sized groups', () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('leaves a shorter final chunk', () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 2)).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
  });

  it('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('returns undefined when array is undefined', () => {
    expect(chunk(undefined, 3)).toBeUndefined();
  });

  it('returns undefined when size is undefined', () => {
    expect(chunk([1, 2], undefined)).toBeUndefined();
  });

  it('throws on non-array first argument', () => {
    expect(() => chunk('hello' as any, 2)).toThrow(/chunk/);
  });

  it('throws when size is zero', () => {
    expect(() => chunk([1, 2], 0)).toThrow(/chunk/);
  });

  it('throws when size is negative', () => {
    expect(() => chunk([1, 2], -1)).toThrow(/chunk/);
  });

  it('throws when size is not an integer', () => {
    expect(() => chunk([1, 2], 1.5)).toThrow(/chunk/);
  });

  it('throws when size is not a number', () => {
    expect(() => chunk([1, 2], 'x' as any)).toThrow(/chunk/);
  });
});

describe('union', () => {
  it('returns empty array when called with no arguments', () => {
    expect(union()).toEqual([]);
  });

  it('deduplicates a single array', () => {
    expect(union([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('merges two arrays with overlap, preserving first-seen order', () => {
    expect(union([1, 2, 3], [2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('merges two arrays with no overlap', () => {
    expect(union([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('merges three arrays', () => {
    expect(union([1], [2], [1, 3])).toEqual([1, 2, 3]);
  });

  it('handles empty arrays', () => {
    expect(union([], [])).toEqual([]);
  });

  it('handles mix of empty and non-empty arrays', () => {
    expect(union([], [1, 2], [])).toEqual([1, 2]);
  });

  it('returns undefined when any argument is undefined', () => {
    expect(union([1, 2], undefined)).toBeUndefined();
  });

  it('returns undefined when the first argument is undefined', () => {
    expect(union(undefined, [1, 2])).toBeUndefined();
  });

  it('returns undefined when a middle argument is undefined', () => {
    expect(union([1], undefined, [2])).toBeUndefined();
  });

  it('throws when a non-array argument is passed', () => {
    expect(() => union([1, 2], 'hello' as any)).toThrow(/union/);
  });

  it('throws when a number is passed as argument', () => {
    expect(() => union(42 as any)).toThrow(/union/);
  });

  it('preserves string elements', () => {
    expect(union(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('preserves mixed types', () => {
    expect(union([1, 'a'], ['a', 2])).toEqual([1, 'a', 2]);
  });
});

describe('intersect', () => {
  it('returns empty array when called with no arguments', () => {
    expect(intersect()).toEqual([]);
  });

  it('deduplicates a single array', () => {
    expect(intersect([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('returns elements present in both arrays', () => {
    expect(intersect([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it('returns empty when no overlap', () => {
    expect(intersect([1, 2], [3, 4])).toEqual([]);
  });

  it('handles three arrays and returns elements in all three', () => {
    expect(intersect([1, 2, 3], [2, 3, 4], [3, 2])).toEqual([2, 3]);
  });

  it('returns empty when three arrays share no common element', () => {
    expect(intersect([1, 2], [2, 3], [3, 4])).toEqual([]);
  });

  it('deduplicates elements from the first array', () => {
    expect(intersect([1, 2, 2, 3], [2, 3, 3])).toEqual([2, 3]);
  });

  it('preserves order from the first array', () => {
    expect(intersect([3, 2, 1], [1, 2])).toEqual([2, 1]);
  });

  it('returns undefined when any argument is undefined', () => {
    expect(intersect([1, 2], undefined)).toBeUndefined();
  });

  it('returns undefined when the first argument is undefined', () => {
    expect(intersect(undefined, [1, 2])).toBeUndefined();
  });

  it('returns undefined when a middle argument is undefined', () => {
    expect(intersect([1], undefined, [2])).toBeUndefined();
  });

  it('throws when a non-array argument is passed', () => {
    expect(() => intersect([1, 2], 'hello' as any)).toThrow(/intersect/);
  });

  it('throws when a number is passed as argument', () => {
    expect(() => intersect(42 as any)).toThrow(/intersect/);
  });

  it('handles empty arrays', () => {
    expect(intersect([], [1, 2])).toEqual([]);
    expect(intersect([1, 2], [])).toEqual([]);
  });

  it('handles string elements', () => {
    expect(intersect(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
  });
});

describe('groupBy', () => {
  it('groups elements by the callback return value', () => {
    const result = groupBy([1, 2, 3, 4, 5, 6], (n: number) => n % 2 === 0 ? 'even' : 'odd');
    expect(result).toEqual({ odd: [1, 3, 5], even: [2, 4, 6] });
  });

  it('returns undefined when array is undefined', () => {
    expect(groupBy(undefined, (x: any) => x)).toBeUndefined();
  });

  it('throws when first argument is not an array', () => {
    expect(() => groupBy('hello' as any, (x: any) => x)).toThrow(/groupBy/);
  });

  it('throws when first argument is a number', () => {
    expect(() => groupBy(42 as any, (x: any) => x)).toThrow(/groupBy/);
  });

  it('throws when second argument is not a function', () => {
    expect(() => groupBy([1, 2], 'not-a-fn' as any)).toThrow(/groupBy/);
  });

  it('throws when second argument is undefined', () => {
    expect(() => groupBy([1, 2], undefined)).toThrow(/groupBy/);
  });

  it('throws when second argument is a number', () => {
    expect(() => groupBy([1, 2], 42 as any)).toThrow(/groupBy/);
  });

  it('passes (element, index) to the callback', () => {
    const calls: [any, number][] = [];
    groupBy(['a', 'b', 'c'], (el: string, idx: number) => {
      calls.push([el, idx]);
      return 'group';
    });
    expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
  });

  it('handles multiple groups', () => {
    const result = groupBy(
      ['apple', 'avocado', 'banana', 'blueberry', 'cherry'],
      (s: string) => s[0]
    );
    expect(result).toEqual({
      a: ['apple', 'avocado'],
      b: ['banana', 'blueberry'],
      c: ['cherry']
    });
  });

  it('converts keys to strings', () => {
    const result = groupBy([1, 2, 3], (n: number) => n % 2);
    expect(result).toEqual({ '1': [1, 3], '0': [2] });
  });

  it('returns empty object for empty array', () => {
    expect(groupBy([], (x: any) => x)).toEqual({});
  });
});

describe('countBy', () => {
  it('counts elements per key', () => {
    const result = countBy([1, 2, 3, 4, 5], (n: number) => n > 2 ? 'big' : 'small');
    expect(result).toEqual({ small: 2, big: 3 });
  });

  it('returns undefined when array is undefined', () => {
    expect(countBy(undefined, (x: any) => x)).toBeUndefined();
  });

  it('throws when first argument is not an array', () => {
    expect(() => countBy('hello' as any, (x: any) => x)).toThrow(/countBy/);
  });

  it('throws when first argument is a number', () => {
    expect(() => countBy(42 as any, (x: any) => x)).toThrow(/countBy/);
  });

  it('throws when second argument is not a function', () => {
    expect(() => countBy([1, 2], 'not-a-fn' as any)).toThrow(/countBy/);
  });

  it('throws when second argument is undefined', () => {
    expect(() => countBy([1, 2], undefined)).toThrow(/countBy/);
  });

  it('throws when second argument is a number', () => {
    expect(() => countBy([1, 2], 42 as any)).toThrow(/countBy/);
  });

  it('passes (element, index) to the callback', () => {
    const calls: [any, number][] = [];
    countBy(['a', 'b', 'c'], (el: string, idx: number) => {
      calls.push([el, idx]);
      return 'group';
    });
    expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
  });

  it('handles multiple groups with various counts', () => {
    const result = countBy(
      ['apple', 'avocado', 'banana', 'blueberry', 'cherry'],
      (s: string) => s[0]
    );
    expect(result).toEqual({ a: 2, b: 2, c: 1 });
  });

  it('converts keys to strings', () => {
    const result = countBy([1, 2, 3], (n: number) => n % 2);
    expect(result).toEqual({ '1': 2, '0': 1 });
  });

  it('returns empty object for empty array', () => {
    expect(countBy([], (x: any) => x)).toEqual({});
  });
});
