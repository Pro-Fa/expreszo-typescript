import { describe, it, expect } from 'vitest';
import {
  atan2,
  fac,
  gamma,
  hypot,
  max,
  min,
  roundTo,
  clamp,
} from '../../../src/functions/math/advanced.js';

describe('advanced math functions (direct)', () => {

  describe('max()', () => {
    it('returns the largest of spread arguments', () => {
      expect(max(1, 2, 3)).toBe(3);
      expect(max(10, -5, 7)).toBe(10);
    });

    it('returns the largest value from a single array argument', () => {
      expect(max([1, 2, 3])).toBe(3);
      expect(max([10, -5, 7])).toBe(10);
      expect(max([-1, -2, -3])).toBe(-1);
    });

    it('returns undefined when single array argument contains undefined', () => {
      expect(max([1, undefined, 3])).toBeUndefined();
      expect(max([undefined])).toBeUndefined();
    });

    it('returns undefined when spread arguments contain undefined', () => {
      expect(max(undefined, 2)).toBeUndefined();
      expect(max(1, undefined)).toBeUndefined();
    });

    it('handles a single-element array', () => {
      expect(max([42])).toBe(42);
    });
  });

  describe('min()', () => {
    it('returns the smallest of spread arguments', () => {
      expect(min(1, 2, 3)).toBe(1);
      expect(min(10, -5, 7)).toBe(-5);
    });

    it('returns the smallest value from a single array argument', () => {
      expect(min([1, 2, 3])).toBe(1);
      expect(min([10, -5, 7])).toBe(-5);
      expect(min([-1, -2, -3])).toBe(-3);
    });

    it('returns undefined when single array argument contains undefined', () => {
      expect(min([1, undefined, 3])).toBeUndefined();
      expect(min([undefined])).toBeUndefined();
    });

    it('returns undefined when spread arguments contain undefined', () => {
      expect(min(undefined, 2)).toBeUndefined();
      expect(min(1, undefined)).toBeUndefined();
    });

    it('handles a single-element array', () => {
      expect(min([42])).toBe(42);
    });
  });

  describe('atan2()', () => {
    it('computes atan2 for standard inputs', () => {
      expect(atan2(1, 1)).toBe(Math.atan2(1, 1));
      expect(atan2(0, 1)).toBe(Math.atan2(0, 1));
      expect(atan2(1, 0)).toBe(Math.atan2(1, 0));
    });

    it('returns undefined when either argument is undefined', () => {
      expect(atan2(undefined, 1)).toBeUndefined();
      expect(atan2(1, undefined)).toBeUndefined();
      expect(atan2(undefined, undefined)).toBeUndefined();
    });
  });

  describe('fac()', () => {
    it('computes factorial for small non-negative integers', () => {
      expect(fac(0)).toBe(1);
      expect(fac(1)).toBe(1);
      expect(fac(5)).toBe(120);
      expect(fac(10)).toBe(3628800);
    });

    it('returns undefined for undefined input', () => {
      expect(fac(undefined)).toBeUndefined();
    });
  });

  describe('gamma()', () => {
    it('returns undefined for undefined input', () => {
      expect(gamma(undefined)).toBeUndefined();
    });

    it('computes gamma for positive integers (gamma(n) = (n-1)!)', () => {
      expect(gamma(1)).toBe(1);
      expect(gamma(5)).toBe(24);
      expect(gamma(7)).toBe(720);
    });

    it('returns Infinity for non-positive integers', () => {
      expect(gamma(0)).toBe(Infinity);
      expect(gamma(-1)).toBe(Infinity);
    });

    it('returns Infinity for very large values', () => {
      expect(gamma(172)).toBe(Infinity);
      expect(gamma(200)).toBe(Infinity);
    });

    it('handles values less than 0.5 via reflection formula', () => {
      const result = gamma(0.25);
      expect(result).toBeCloseTo(3.6256, 3);
    });

    it('handles large non-integer values via extended Stirling', () => {
      const result = gamma(90.5);
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('returns NaN for negative infinity', () => {
      expect(gamma(-Infinity)).toBeNaN();
    });
  });

  describe('hypot()', () => {
    it('computes the Euclidean norm', () => {
      expect(hypot(3, 4)).toBe(5);
      expect(hypot(5, 12)).toBe(13);
    });

    it('handles three or more arguments', () => {
      expect(hypot(1, 2, 2)).toBe(3);
    });

    it('returns undefined when any argument is undefined', () => {
      expect(hypot(undefined, 4)).toBeUndefined();
      expect(hypot(3, undefined)).toBeUndefined();
    });

    it('handles zero arguments', () => {
      expect(hypot()).toBe(0);
    });
  });

  describe('roundTo()', () => {
    it('rounds to the nearest integer when exp is omitted', () => {
      expect(roundTo(2.5)).toBe(3);
      expect(roundTo(2.4)).toBe(2);
    });

    it('rounds to the nearest integer when exp is 0', () => {
      expect(roundTo(3.7, 0)).toBe(4);
    });

    it('rounds to the specified number of decimal places', () => {
      expect(roundTo(1.2345, 2)).toBeCloseTo(1.23, 10);
      expect(roundTo(1.2355, 2)).toBeCloseTo(1.24, 10);
    });

    it('returns undefined for undefined value', () => {
      expect(roundTo(undefined)).toBeUndefined();
    });

    it('returns NaN for NaN input', () => {
      expect(roundTo(NaN, 2)).toBeNaN();
    });
  });

  describe('clamp()', () => {
    it('returns value within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns undefined when any argument is undefined', () => {
      expect(clamp(undefined, 0, 10)).toBeUndefined();
      expect(clamp(5, undefined, 10)).toBeUndefined();
      expect(clamp(5, 0, undefined)).toBeUndefined();
    });
  });
});
