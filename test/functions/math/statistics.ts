import { describe, it, expect } from 'vitest';
import {
  mean,
  median,
  mostFrequent,
  variance,
  stddev,
  percentile,
} from '../../../src/functions/math/statistics.js';

describe('statistics functions (direct)', () => {

  describe('mean()', () => {
    it('computes the arithmetic mean', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20, 30])).toBe(20);
    });

    it('returns undefined for an empty array', () => {
      expect(mean([])).toBeUndefined();
    });

    it('returns undefined when the array is undefined', () => {
      expect(mean(undefined)).toBeUndefined();
    });

    it('returns undefined when the array contains undefined', () => {
      expect(mean([1, undefined, 3])).toBeUndefined();
    });

    it('throws on non-array input', () => {
      expect(() => mean(42 as any)).toThrow(/mean/);
    });

    it('throws on non-numeric elements', () => {
      expect(() => mean(['a', 'b'] as any)).toThrow(/mean/);
    });
  });

  describe('median()', () => {
    it('returns the middle value for odd length', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it('averages two middle values for even length', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('handles unsorted arrays', () => {
      expect(median([5, 1, 3, 2, 4])).toBe(3);
    });

    it('returns undefined for an empty array', () => {
      expect(median([])).toBeUndefined();
    });

    it('returns undefined when the array is undefined', () => {
      expect(median(undefined)).toBeUndefined();
    });

    it('returns undefined when the array contains undefined', () => {
      expect(median([1, undefined, 3])).toBeUndefined();
    });
  });

  describe('mostFrequent()', () => {
    it('returns the most common value', () => {
      expect(mostFrequent([1, 2, 2, 3, 3, 3])).toBe(3);
    });

    it('works with strings', () => {
      expect(mostFrequent(['a', 'b', 'a'])).toBe('a');
    });

    it('returns the first-seen value on ties', () => {
      expect(mostFrequent([1, 2, 3])).toBe(1);
    });

    it('returns undefined for an empty array', () => {
      expect(mostFrequent([])).toBeUndefined();
    });

    it('returns undefined when the array is undefined', () => {
      expect(mostFrequent(undefined)).toBeUndefined();
    });

    it('returns undefined when the array contains undefined', () => {
      expect(mostFrequent([1, undefined, 2])).toBeUndefined();
    });

    it('throws on non-array input', () => {
      expect(() => mostFrequent(42 as any)).toThrow(/mostFrequent/);
    });
  });

  describe('variance()', () => {
    it('computes population variance', () => {
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
    });

    it('returns 0 for a constant array', () => {
      expect(variance([5, 5, 5, 5])).toBe(0);
    });

    it('returns undefined for an empty array', () => {
      expect(variance([])).toBeUndefined();
    });

    it('returns undefined when the array is undefined', () => {
      expect(variance(undefined)).toBeUndefined();
    });

    it('returns undefined when the array contains undefined', () => {
      expect(variance([1, undefined, 3])).toBeUndefined();
    });
  });

  describe('stddev()', () => {
    it('is the square root of variance', () => {
      expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    });

    it('returns 0 for a constant array', () => {
      expect(stddev([10, 10, 10])).toBe(0);
    });

    it('returns undefined for an empty array', () => {
      expect(stddev([])).toBeUndefined();
    });

    it('returns undefined when the array is undefined', () => {
      expect(stddev(undefined)).toBeUndefined();
    });

    it('returns undefined when the array contains undefined', () => {
      expect(stddev([1, undefined, 3])).toBeUndefined();
    });
  });

  describe('percentile()', () => {
    it('computes the 50th percentile (median)', () => {
      expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    });

    it('interpolates between ranks', () => {
      expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9.1);
    });

    it('returns the min at p=0 and max at p=100', () => {
      expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
      expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
    });

    it('returns the single value for a one-element array', () => {
      expect(percentile([7], 25)).toBe(7);
    });

    it('returns undefined when p is undefined', () => {
      expect(percentile([1, 2, 3], undefined)).toBeUndefined();
    });

    // --- UNCOVERED BRANCHES ---

    it('throws when p is NaN', () => {
      expect(() => percentile([1, 2, 3, 4], NaN)).toThrow(/percentile/);
    });

    it('throws when p is Infinity', () => {
      expect(() => percentile([1, 2, 3, 4], Infinity)).toThrow(/percentile/);
    });

    it('throws when p is negative Infinity', () => {
      expect(() => percentile([1, 2, 3, 4], -Infinity)).toThrow(/percentile/);
    });

    it('throws when p is less than 0', () => {
      expect(() => percentile([1, 2, 3, 4], -1)).toThrow(/percentile/);
    });

    it('throws when p is greater than 100', () => {
      expect(() => percentile([1, 2, 3, 4], 101)).toThrow(/percentile/);
    });

    it('returns undefined for an empty array', () => {
      expect(percentile([], 50)).toBeUndefined();
    });

    it('returns undefined when array contains undefined', () => {
      expect(percentile([1, undefined, 3], 50)).toBeUndefined();
    });

    it('returns undefined when array is undefined', () => {
      expect(percentile(undefined, 50)).toBeUndefined();
    });
  });
});
