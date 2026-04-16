import { describe, it, expect } from 'vitest';
import {
  equal,
  notEqual,
  greaterThan,
  lessThan,
  greaterThanEqual,
  lessThanEqual,
  greaterThanLegacy,
  lessThanLegacy,
  greaterThanEqualLegacy,
  lessThanEqualLegacy
} from '../../../src/operators/binary/comparison.js';

describe('Binary Comparison Operators', () => {
  describe('equal', () => {
    it('should return true for equal numbers', () => {
      expect(equal(1, 1)).toBe(true);
      expect(equal(0, 0)).toBe(true);
      expect(equal(-5, -5)).toBe(true);
      expect(equal(3.14, 3.14)).toBe(true);
    });

    it('should return false for unequal numbers', () => {
      expect(equal(1, 2)).toBe(false);
      expect(equal(0, 1)).toBe(false);
      expect(equal(-5, 5)).toBe(false);
    });

    it('should return true for equal strings', () => {
      expect(equal('hello', 'hello')).toBe(true);
      expect(equal('', '')).toBe(true);
    });

    it('should return false for unequal strings', () => {
      expect(equal('hello', 'world')).toBe(false);
      expect(equal('hello', 'Hello')).toBe(false);
    });

    it('should use strict equality (no type coercion)', () => {
      expect(equal(1, '1')).toBe(false);
      expect(equal(0, '')).toBe(false);
      expect(equal(0, false)).toBe(false);
      expect(equal(1, true)).toBe(false);
      expect(equal(null, undefined)).toBe(false);
    });

    it('should handle null', () => {
      expect(equal(null, null)).toBe(true);
      expect(equal(null, 0)).toBe(false);
      expect(equal(null, '')).toBe(false);
      expect(equal(null, false)).toBe(false);
    });

    it('should handle undefined', () => {
      expect(equal(undefined, undefined)).toBe(true);
      expect(equal(undefined, 0)).toBe(false);
      expect(equal(undefined, '')).toBe(false);
      expect(equal(undefined, null)).toBe(false);
    });

    it('should handle NaN (NaN !== NaN)', () => {
      expect(equal(NaN, NaN)).toBe(false);
      expect(equal(NaN, 0)).toBe(false);
      expect(equal(NaN, undefined)).toBe(false);
    });

    it('should handle object references', () => {
      const obj = { a: 1 };
      expect(equal(obj, obj)).toBe(true);
      expect(equal({ a: 1 }, { a: 1 })).toBe(false); // different references
      expect(equal([], [])).toBe(false); // different references
    });

    it('should handle boolean values', () => {
      expect(equal(true, true)).toBe(true);
      expect(equal(false, false)).toBe(true);
      expect(equal(true, false)).toBe(false);
    });
  });

  describe('notEqual', () => {
    it('should return false for equal numbers', () => {
      expect(notEqual(1, 1)).toBe(false);
      expect(notEqual(0, 0)).toBe(false);
      expect(notEqual(-5, -5)).toBe(false);
      expect(notEqual(3.14, 3.14)).toBe(false);
    });

    it('should return true for unequal numbers', () => {
      expect(notEqual(1, 2)).toBe(true);
      expect(notEqual(0, 1)).toBe(true);
      expect(notEqual(-5, 5)).toBe(true);
    });

    it('should return false for equal strings', () => {
      expect(notEqual('hello', 'hello')).toBe(false);
      expect(notEqual('', '')).toBe(false);
    });

    it('should return true for unequal strings', () => {
      expect(notEqual('hello', 'world')).toBe(true);
      expect(notEqual('hello', 'Hello')).toBe(true);
    });

    it('should use strict inequality (no type coercion)', () => {
      expect(notEqual(1, '1')).toBe(true);
      expect(notEqual(0, '')).toBe(true);
      expect(notEqual(0, false)).toBe(true);
      expect(notEqual(1, true)).toBe(true);
      expect(notEqual(null, undefined)).toBe(true);
    });

    it('should handle null', () => {
      expect(notEqual(null, null)).toBe(false);
      expect(notEqual(null, 0)).toBe(true);
      expect(notEqual(null, '')).toBe(true);
    });

    it('should handle undefined', () => {
      expect(notEqual(undefined, undefined)).toBe(false);
      expect(notEqual(undefined, 0)).toBe(true);
      expect(notEqual(undefined, null)).toBe(true);
    });

    it('should handle NaN (NaN !== NaN is true)', () => {
      expect(notEqual(NaN, NaN)).toBe(true);
      expect(notEqual(NaN, 0)).toBe(true);
      expect(notEqual(NaN, undefined)).toBe(true);
    });

    it('should handle object references', () => {
      const obj = { a: 1 };
      expect(notEqual(obj, obj)).toBe(false);
      expect(notEqual({ a: 1 }, { a: 1 })).toBe(true); // different references
      expect(notEqual([], [])).toBe(true); // different references
    });

    it('should handle boolean values', () => {
      expect(notEqual(true, true)).toBe(false);
      expect(notEqual(false, false)).toBe(false);
      expect(notEqual(true, false)).toBe(true);
    });
  });

  describe('greaterThan', () => {
    it('should compare numbers correctly', () => {
      expect(greaterThan(5, 3)).toBe(true);
      expect(greaterThan(3, 5)).toBe(false);
      expect(greaterThan(5, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(greaterThan(-1, -5)).toBe(true);
      expect(greaterThan(-5, -1)).toBe(false);
      expect(greaterThan(0, -1)).toBe(true);
      expect(greaterThan(-1, 0)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(greaterThan(3.14, 3.13)).toBe(true);
      expect(greaterThan(3.13, 3.14)).toBe(false);
    });

    it('should return undefined when first operand is undefined', () => {
      expect(greaterThan(undefined, 5)).toBe(undefined);
      expect(greaterThan(undefined, 0)).toBe(undefined);
      expect(greaterThan(undefined, -5)).toBe(undefined);
    });

    it('should return undefined when second operand is undefined', () => {
      expect(greaterThan(5, undefined)).toBe(undefined);
      expect(greaterThan(0, undefined)).toBe(undefined);
      expect(greaterThan(-5, undefined)).toBe(undefined);
    });

    it('should return undefined when both operands are undefined', () => {
      expect(greaterThan(undefined, undefined)).toBe(undefined);
    });

    it('should handle string comparisons', () => {
      expect(greaterThan('b', 'a')).toBe(true);
      expect(greaterThan('a', 'b')).toBe(false);
      expect(greaterThan('a', 'a')).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(greaterThan(NaN, 1)).toBe(false);
      expect(greaterThan(1, NaN)).toBe(false);
      expect(greaterThan(NaN, NaN)).toBe(false);
    });

    it('should handle null (not undefined, so no early return)', () => {
      expect(greaterThan(null, 0)).toBe(false);
      expect(greaterThan(0, null)).toBe(false);
      expect(greaterThan(1, null)).toBe(true);
      expect(greaterThan(null, -1)).toBe(true);
    });

    it('should handle Infinity', () => {
      expect(greaterThan(Infinity, 1000000)).toBe(true);
      expect(greaterThan(-Infinity, -1000000)).toBe(false);
      expect(greaterThan(Infinity, Infinity)).toBe(false);
    });
  });

  describe('lessThan', () => {
    it('should compare numbers correctly', () => {
      expect(lessThan(3, 5)).toBe(true);
      expect(lessThan(5, 3)).toBe(false);
      expect(lessThan(5, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(lessThan(-5, -1)).toBe(true);
      expect(lessThan(-1, -5)).toBe(false);
      expect(lessThan(-1, 0)).toBe(true);
      expect(lessThan(0, -1)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(lessThan(3.13, 3.14)).toBe(true);
      expect(lessThan(3.14, 3.13)).toBe(false);
    });

    it('should return undefined when first operand is undefined', () => {
      expect(lessThan(undefined, 5)).toBe(undefined);
      expect(lessThan(undefined, 0)).toBe(undefined);
      expect(lessThan(undefined, -5)).toBe(undefined);
    });

    it('should return undefined when second operand is undefined', () => {
      expect(lessThan(5, undefined)).toBe(undefined);
      expect(lessThan(0, undefined)).toBe(undefined);
      expect(lessThan(-5, undefined)).toBe(undefined);
    });

    it('should return undefined when both operands are undefined', () => {
      expect(lessThan(undefined, undefined)).toBe(undefined);
    });

    it('should handle string comparisons', () => {
      expect(lessThan('a', 'b')).toBe(true);
      expect(lessThan('b', 'a')).toBe(false);
      expect(lessThan('a', 'a')).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(lessThan(NaN, 1)).toBe(false);
      expect(lessThan(1, NaN)).toBe(false);
      expect(lessThan(NaN, NaN)).toBe(false);
    });

    it('should handle null (not undefined, so no early return)', () => {
      expect(lessThan(0, null)).toBe(false);
      expect(lessThan(null, 0)).toBe(false);
      expect(lessThan(null, 1)).toBe(true);
      expect(lessThan(-1, null)).toBe(true);
    });

    it('should handle Infinity', () => {
      expect(lessThan(1000000, Infinity)).toBe(true);
      expect(lessThan(-1000000, -Infinity)).toBe(false);
      expect(lessThan(-Infinity, Infinity)).toBe(true);
    });
  });

  describe('greaterThanEqual', () => {
    it('should compare numbers correctly', () => {
      expect(greaterThanEqual(5, 3)).toBe(true);
      expect(greaterThanEqual(5, 5)).toBe(true);
      expect(greaterThanEqual(3, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(greaterThanEqual(-1, -5)).toBe(true);
      expect(greaterThanEqual(-5, -5)).toBe(true);
      expect(greaterThanEqual(-5, -1)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(greaterThanEqual(3.14, 3.14)).toBe(true);
      expect(greaterThanEqual(3.14, 3.13)).toBe(true);
      expect(greaterThanEqual(3.13, 3.14)).toBe(false);
    });

    it('should return undefined when first operand is undefined', () => {
      expect(greaterThanEqual(undefined, 5)).toBe(undefined);
      expect(greaterThanEqual(undefined, 0)).toBe(undefined);
    });

    it('should return undefined when second operand is undefined', () => {
      expect(greaterThanEqual(5, undefined)).toBe(undefined);
      expect(greaterThanEqual(0, undefined)).toBe(undefined);
    });

    it('should return undefined when both operands are undefined', () => {
      expect(greaterThanEqual(undefined, undefined)).toBe(undefined);
    });

    it('should handle NaN comparisons', () => {
      expect(greaterThanEqual(NaN, 1)).toBe(false);
      expect(greaterThanEqual(1, NaN)).toBe(false);
      expect(greaterThanEqual(NaN, NaN)).toBe(false);
    });

    it('should handle null (not undefined, so no early return)', () => {
      expect(greaterThanEqual(0, null)).toBe(true);
      expect(greaterThanEqual(null, 0)).toBe(true);
      expect(greaterThanEqual(1, null)).toBe(true);
      expect(greaterThanEqual(null, 1)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(greaterThanEqual(Infinity, 1000000)).toBe(true);
      expect(greaterThanEqual(Infinity, Infinity)).toBe(true);
      expect(greaterThanEqual(-Infinity, -Infinity)).toBe(true);
    });
  });

  describe('lessThanEqual', () => {
    it('should compare numbers correctly', () => {
      expect(lessThanEqual(3, 5)).toBe(true);
      expect(lessThanEqual(5, 5)).toBe(true);
      expect(lessThanEqual(5, 3)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(lessThanEqual(-5, -1)).toBe(true);
      expect(lessThanEqual(-5, -5)).toBe(true);
      expect(lessThanEqual(-1, -5)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(lessThanEqual(3.14, 3.14)).toBe(true);
      expect(lessThanEqual(3.13, 3.14)).toBe(true);
      expect(lessThanEqual(3.14, 3.13)).toBe(false);
    });

    it('should return undefined when first operand is undefined', () => {
      expect(lessThanEqual(undefined, 5)).toBe(undefined);
      expect(lessThanEqual(undefined, 0)).toBe(undefined);
    });

    it('should return undefined when second operand is undefined', () => {
      expect(lessThanEqual(5, undefined)).toBe(undefined);
      expect(lessThanEqual(0, undefined)).toBe(undefined);
    });

    it('should return undefined when both operands are undefined', () => {
      expect(lessThanEqual(undefined, undefined)).toBe(undefined);
    });

    it('should handle NaN comparisons', () => {
      expect(lessThanEqual(NaN, 1)).toBe(false);
      expect(lessThanEqual(1, NaN)).toBe(false);
      expect(lessThanEqual(NaN, NaN)).toBe(false);
    });

    it('should handle null (not undefined, so no early return)', () => {
      expect(lessThanEqual(0, null)).toBe(true);
      expect(lessThanEqual(null, 0)).toBe(true);
      expect(lessThanEqual(null, 1)).toBe(true);
      expect(lessThanEqual(1, null)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(lessThanEqual(1000000, Infinity)).toBe(true);
      expect(lessThanEqual(Infinity, Infinity)).toBe(true);
      expect(lessThanEqual(-Infinity, -Infinity)).toBe(true);
    });
  });

  describe('greaterThanLegacy', () => {
    it('should compare numbers correctly', () => {
      expect(greaterThanLegacy(5, 3)).toBe(true);
      expect(greaterThanLegacy(3, 5)).toBe(false);
      expect(greaterThanLegacy(5, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(greaterThanLegacy(-1, -5)).toBe(true);
      expect(greaterThanLegacy(-5, -1)).toBe(false);
      expect(greaterThanLegacy(0, -1)).toBe(true);
    });

    it('should handle floating point numbers', () => {
      expect(greaterThanLegacy(3.14, 3.13)).toBe(true);
      expect(greaterThanLegacy(3.13, 3.14)).toBe(false);
    });

    it('should not return undefined for undefined inputs (unlike non-legacy)', () => {
      // Legacy functions do not guard against undefined
      expect(greaterThanLegacy(undefined, 5)).toBe(false);
      expect(greaterThanLegacy(5, undefined)).toBe(false);
      expect(greaterThanLegacy(undefined, undefined)).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(greaterThanLegacy(NaN, 1)).toBe(false);
      expect(greaterThanLegacy(1, NaN)).toBe(false);
      expect(greaterThanLegacy(NaN, NaN)).toBe(false);
    });

    it('should handle null', () => {
      expect(greaterThanLegacy(1, null)).toBe(true);
      expect(greaterThanLegacy(null, 1)).toBe(false);
      expect(greaterThanLegacy(null, null)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(greaterThanLegacy(Infinity, 1000000)).toBe(true);
      expect(greaterThanLegacy(-Infinity, 1000000)).toBe(false);
      expect(greaterThanLegacy(Infinity, Infinity)).toBe(false);
    });

    it('should handle string comparisons', () => {
      expect(greaterThanLegacy('b', 'a')).toBe(true);
      expect(greaterThanLegacy('a', 'b')).toBe(false);
      expect(greaterThanLegacy('a', 'a')).toBe(false);
    });

    it('should handle mixed types', () => {
      expect(greaterThanLegacy('5', 3)).toBe(true);
      expect(greaterThanLegacy(3, '5')).toBe(false);
    });
  });

  describe('lessThanLegacy', () => {
    it('should compare numbers correctly', () => {
      expect(lessThanLegacy(3, 5)).toBe(true);
      expect(lessThanLegacy(5, 3)).toBe(false);
      expect(lessThanLegacy(5, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(lessThanLegacy(-5, -1)).toBe(true);
      expect(lessThanLegacy(-1, -5)).toBe(false);
      expect(lessThanLegacy(-1, 0)).toBe(true);
    });

    it('should handle floating point numbers', () => {
      expect(lessThanLegacy(3.13, 3.14)).toBe(true);
      expect(lessThanLegacy(3.14, 3.13)).toBe(false);
    });

    it('should not return undefined for undefined inputs (unlike non-legacy)', () => {
      expect(lessThanLegacy(undefined, 5)).toBe(false);
      expect(lessThanLegacy(5, undefined)).toBe(false);
      expect(lessThanLegacy(undefined, undefined)).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(lessThanLegacy(NaN, 1)).toBe(false);
      expect(lessThanLegacy(1, NaN)).toBe(false);
      expect(lessThanLegacy(NaN, NaN)).toBe(false);
    });

    it('should handle null', () => {
      expect(lessThanLegacy(null, 1)).toBe(true);
      expect(lessThanLegacy(1, null)).toBe(false);
      expect(lessThanLegacy(null, null)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(lessThanLegacy(1000000, Infinity)).toBe(true);
      expect(lessThanLegacy(1000000, -Infinity)).toBe(false);
      expect(lessThanLegacy(-Infinity, -Infinity)).toBe(false);
    });

    it('should handle string comparisons', () => {
      expect(lessThanLegacy('a', 'b')).toBe(true);
      expect(lessThanLegacy('b', 'a')).toBe(false);
      expect(lessThanLegacy('a', 'a')).toBe(false);
    });

    it('should handle mixed types', () => {
      expect(lessThanLegacy(3, '5')).toBe(true);
      expect(lessThanLegacy('5', 3)).toBe(false);
    });
  });

  describe('greaterThanEqualLegacy', () => {
    it('should compare numbers correctly', () => {
      expect(greaterThanEqualLegacy(5, 3)).toBe(true);
      expect(greaterThanEqualLegacy(5, 5)).toBe(true);
      expect(greaterThanEqualLegacy(3, 5)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(greaterThanEqualLegacy(-1, -5)).toBe(true);
      expect(greaterThanEqualLegacy(-5, -5)).toBe(true);
      expect(greaterThanEqualLegacy(-5, -1)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(greaterThanEqualLegacy(3.14, 3.14)).toBe(true);
      expect(greaterThanEqualLegacy(3.14, 3.13)).toBe(true);
      expect(greaterThanEqualLegacy(3.13, 3.14)).toBe(false);
    });

    it('should not return undefined for undefined inputs (unlike non-legacy)', () => {
      // undefined >= 5 => NaN >= 5 => false
      expect(greaterThanEqualLegacy(undefined, 5)).toBe(false);
      // 5 >= undefined => 5 >= NaN => false
      expect(greaterThanEqualLegacy(5, undefined)).toBe(false);
      // undefined >= undefined => NaN >= NaN => false
      expect(greaterThanEqualLegacy(undefined, undefined)).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(greaterThanEqualLegacy(NaN, 1)).toBe(false);
      expect(greaterThanEqualLegacy(1, NaN)).toBe(false);
      expect(greaterThanEqualLegacy(NaN, NaN)).toBe(false);
    });

    it('should handle null', () => {
      expect(greaterThanEqualLegacy(0, null)).toBe(true);
      expect(greaterThanEqualLegacy(null, 0)).toBe(true);
      expect(greaterThanEqualLegacy(1, null)).toBe(true);
      expect(greaterThanEqualLegacy(null, 1)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(greaterThanEqualLegacy(Infinity, 1000000)).toBe(true);
      expect(greaterThanEqualLegacy(Infinity, Infinity)).toBe(true);
      expect(greaterThanEqualLegacy(-Infinity, -Infinity)).toBe(true);
    });

    it('should handle string comparisons', () => {
      expect(greaterThanEqualLegacy('b', 'a')).toBe(true);
      expect(greaterThanEqualLegacy('a', 'a')).toBe(true);
      expect(greaterThanEqualLegacy('a', 'b')).toBe(false);
    });

    it('should handle mixed types', () => {
      expect(greaterThanEqualLegacy('5', 5)).toBe(true);
      expect(greaterThanEqualLegacy(5, '5')).toBe(true);
    });
  });

  describe('lessThanEqualLegacy', () => {
    it('should compare numbers correctly', () => {
      expect(lessThanEqualLegacy(3, 5)).toBe(true);
      expect(lessThanEqualLegacy(5, 5)).toBe(true);
      expect(lessThanEqualLegacy(5, 3)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(lessThanEqualLegacy(-5, -1)).toBe(true);
      expect(lessThanEqualLegacy(-5, -5)).toBe(true);
      expect(lessThanEqualLegacy(-1, -5)).toBe(false);
    });

    it('should handle floating point numbers', () => {
      expect(lessThanEqualLegacy(3.14, 3.14)).toBe(true);
      expect(lessThanEqualLegacy(3.13, 3.14)).toBe(true);
      expect(lessThanEqualLegacy(3.14, 3.13)).toBe(false);
    });

    it('should not return undefined for undefined inputs (unlike non-legacy)', () => {
      // undefined <= 5 => NaN <= 5 => false
      expect(lessThanEqualLegacy(undefined, 5)).toBe(false);
      // 5 <= undefined => 5 <= NaN => false
      expect(lessThanEqualLegacy(5, undefined)).toBe(false);
      // undefined <= undefined => NaN <= NaN => false
      expect(lessThanEqualLegacy(undefined, undefined)).toBe(false);
    });

    it('should handle NaN comparisons', () => {
      expect(lessThanEqualLegacy(NaN, 1)).toBe(false);
      expect(lessThanEqualLegacy(1, NaN)).toBe(false);
      expect(lessThanEqualLegacy(NaN, NaN)).toBe(false);
    });

    it('should handle null', () => {
      expect(lessThanEqualLegacy(0, null)).toBe(true);
      expect(lessThanEqualLegacy(null, 0)).toBe(true);
      expect(lessThanEqualLegacy(null, 1)).toBe(true);
      expect(lessThanEqualLegacy(1, null)).toBe(false);
    });

    it('should handle Infinity', () => {
      expect(lessThanEqualLegacy(1000000, Infinity)).toBe(true);
      expect(lessThanEqualLegacy(Infinity, Infinity)).toBe(true);
      expect(lessThanEqualLegacy(-Infinity, -Infinity)).toBe(true);
    });

    it('should handle string comparisons', () => {
      expect(lessThanEqualLegacy('a', 'b')).toBe(true);
      expect(lessThanEqualLegacy('a', 'a')).toBe(true);
      expect(lessThanEqualLegacy('b', 'a')).toBe(false);
    });

    it('should handle mixed types', () => {
      expect(lessThanEqualLegacy('5', 5)).toBe(true);
      expect(lessThanEqualLegacy(5, '5')).toBe(true);
    });
  });

  describe('Edge cases across all comparison operators', () => {
    it('should distinguish between legacy and non-legacy undefined handling', () => {
      // Non-legacy: returns undefined for undefined inputs
      expect(greaterThan(undefined, 1)).toBe(undefined);
      expect(lessThan(undefined, 1)).toBe(undefined);
      expect(greaterThanEqual(undefined, 1)).toBe(undefined);
      expect(lessThanEqual(undefined, 1)).toBe(undefined);

      // Legacy: returns boolean for undefined inputs
      expect(typeof greaterThanLegacy(undefined, 1)).toBe('boolean');
      expect(typeof lessThanLegacy(undefined, 1)).toBe('boolean');
      expect(typeof greaterThanEqualLegacy(undefined, 1)).toBe('boolean');
      expect(typeof lessThanEqualLegacy(undefined, 1)).toBe('boolean');
    });

    it('should handle zero edge cases consistently', () => {
      expect(equal(0, -0)).toBe(true);
      expect(notEqual(0, -0)).toBe(false);
      expect(greaterThan(0, -0)).toBe(false);
      expect(lessThan(0, -0)).toBe(false);
      expect(greaterThanEqual(0, -0)).toBe(true);
      expect(lessThanEqual(0, -0)).toBe(true);
    });

    it('should handle Infinity edge cases', () => {
      expect(equal(Infinity, Infinity)).toBe(true);
      expect(equal(-Infinity, -Infinity)).toBe(true);
      expect(equal(Infinity, -Infinity)).toBe(false);
      expect(notEqual(Infinity, -Infinity)).toBe(true);
      expect(greaterThan(Infinity, -Infinity)).toBe(true);
      expect(lessThan(-Infinity, Infinity)).toBe(true);
    });
  });
});
