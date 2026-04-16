import { describe, it, expect } from 'vitest';
import {
  acos,
  acosh,
  asin,
  asinh,
  atan,
  atanh,
  cos,
  cosh,
  sin,
  sinh,
  tan,
  tanh
} from '../../../src/operators/unary/trigonometric.js';

describe('Unary Trigonometric Operators', () => {
  describe('acos (arc cosine)', () => {
    it('should return undefined for undefined input', () => {
      expect(acos(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(acos(1)).toBe(0);
      expect(acos(0)).toBeCloseTo(Math.PI / 2);
      expect(acos(-1)).toBeCloseTo(Math.PI);
    });

    it('should return NaN for values outside [-1, 1]', () => {
      expect(isNaN(acos(2) as number)).toBe(true);
      expect(isNaN(acos(-2) as number)).toBe(true);
    });

    it('should handle special values', () => {
      expect(isNaN(acos(Infinity) as number)).toBe(true);
      expect(isNaN(acos(-Infinity) as number)).toBe(true);
      expect(isNaN(acos(NaN) as number)).toBe(true);
    });
  });

  describe('acosh (inverse hyperbolic cosine)', () => {
    it('should return undefined for undefined input', () => {
      expect(acosh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(acosh(1)).toBe(0);
      expect(acosh(2)).toBeCloseTo(Math.acosh(2));
      expect(acosh(10)).toBeCloseTo(Math.acosh(10));
    });

    it('should return NaN for values less than 1', () => {
      expect(isNaN(acosh(0) as number)).toBe(true);
      expect(isNaN(acosh(-1) as number)).toBe(true);
      expect(isNaN(acosh(0.5) as number)).toBe(true);
    });

    it('should handle special values', () => {
      expect(acosh(Infinity)).toBe(Infinity);
      expect(isNaN(acosh(NaN) as number)).toBe(true);
    });

    it('should work with fallback implementation', () => {
      const originalAcosh = Math.acosh;
      delete (Math as any).acosh;

      expect(acosh(1)).toBeCloseTo(0);
      expect(acosh(2)).toBeCloseTo(originalAcosh(2));
      expect(acosh(10)).toBeCloseTo(originalAcosh(10));

      Math.acosh = originalAcosh;
    });
  });

  describe('asin (arc sine)', () => {
    it('should return undefined for undefined input', () => {
      expect(asin(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(asin(0)).toBe(0);
      expect(asin(1)).toBeCloseTo(Math.PI / 2);
      expect(asin(-1)).toBeCloseTo(-Math.PI / 2);
    });

    it('should return NaN for values outside [-1, 1]', () => {
      expect(isNaN(asin(2) as number)).toBe(true);
      expect(isNaN(asin(-2) as number)).toBe(true);
    });

    it('should handle special values', () => {
      expect(isNaN(asin(Infinity) as number)).toBe(true);
      expect(isNaN(asin(-Infinity) as number)).toBe(true);
      expect(isNaN(asin(NaN) as number)).toBe(true);
    });
  });

  describe('asinh (inverse hyperbolic sine)', () => {
    it('should return undefined for undefined input', () => {
      expect(asinh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(asinh(0)).toBe(0);
      expect(asinh(1)).toBeCloseTo(Math.asinh(1));
      expect(asinh(-1)).toBeCloseTo(Math.asinh(-1));
    });

    it('should handle special values', () => {
      expect(asinh(Infinity)).toBe(Infinity);
      expect(asinh(-Infinity)).toBe(-Infinity);
      expect(isNaN(asinh(NaN) as number)).toBe(true);
    });

    it('should work with fallback implementation', () => {
      const originalAsinh = Math.asinh;
      delete (Math as any).asinh;

      expect(asinh(0)).toBeCloseTo(0);
      expect(asinh(1)).toBeCloseTo(originalAsinh(1));
      expect(asinh(-1)).toBeCloseTo(originalAsinh(-1));
      expect(asinh(-Infinity)).toBe(-Infinity);

      Math.asinh = originalAsinh;
    });
  });

  describe('atan (arc tangent)', () => {
    it('should return undefined for undefined input', () => {
      expect(atan(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(atan(0)).toBe(0);
      expect(atan(1)).toBeCloseTo(Math.PI / 4);
      expect(atan(-1)).toBeCloseTo(-Math.PI / 4);
    });

    it('should handle special values', () => {
      expect(atan(Infinity)).toBeCloseTo(Math.PI / 2);
      expect(atan(-Infinity)).toBeCloseTo(-Math.PI / 2);
      expect(isNaN(atan(NaN) as number)).toBe(true);
    });
  });

  describe('atanh (inverse hyperbolic tangent)', () => {
    it('should return undefined for undefined input', () => {
      expect(atanh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(atanh(0)).toBe(0);
      expect(atanh(0.5)).toBeCloseTo(Math.atanh(0.5));
      expect(atanh(-0.5)).toBeCloseTo(Math.atanh(-0.5));
    });

    it('should handle boundary values', () => {
      expect(atanh(1)).toBe(Infinity);
      expect(atanh(-1)).toBe(-Infinity);
    });

    it('should return NaN for values outside (-1, 1)', () => {
      expect(isNaN(atanh(2) as number)).toBe(true);
      expect(isNaN(atanh(-2) as number)).toBe(true);
    });

    it('should work with fallback implementation', () => {
      const originalAtanh = Math.atanh;
      delete (Math as any).atanh;

      expect(atanh(0)).toBeCloseTo(0);
      expect(atanh(0.5)).toBeCloseTo(originalAtanh(0.5));
      expect(atanh(-0.5)).toBeCloseTo(originalAtanh(-0.5));

      Math.atanh = originalAtanh;
    });
  });

  describe('cos (cosine)', () => {
    it('should return undefined for undefined input', () => {
      expect(cos(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(cos(0)).toBe(1);
      expect(cos(Math.PI)).toBeCloseTo(-1);
      expect(cos(Math.PI / 2)).toBeCloseTo(0);
      expect(cos(-Math.PI)).toBeCloseTo(-1);
    });

    it('should handle special values', () => {
      expect(isNaN(cos(Infinity) as number)).toBe(true);
      expect(isNaN(cos(-Infinity) as number)).toBe(true);
      expect(isNaN(cos(NaN) as number)).toBe(true);
    });
  });

  describe('cosh (hyperbolic cosine)', () => {
    it('should return undefined for undefined input', () => {
      expect(cosh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(cosh(0)).toBe(1);
      expect(cosh(1)).toBeCloseTo(Math.cosh(1));
      expect(cosh(-1)).toBeCloseTo(Math.cosh(-1));
    });

    it('should be symmetric (even function)', () => {
      expect(cosh(2)).toBeCloseTo(cosh(-2) as number);
      expect(cosh(5)).toBeCloseTo(cosh(-5) as number);
    });

    it('should handle special values', () => {
      expect(cosh(Infinity)).toBe(Infinity);
      expect(cosh(-Infinity)).toBe(Infinity);
      expect(isNaN(cosh(NaN) as number)).toBe(true);
    });

    it('should work with fallback implementation', () => {
      const originalCosh = Math.cosh;
      delete (Math as any).cosh;

      expect(cosh(0)).toBeCloseTo(1);
      expect(cosh(1)).toBeCloseTo(originalCosh(1));
      expect(cosh(-1)).toBeCloseTo(originalCosh(-1));

      Math.cosh = originalCosh;
    });
  });

  describe('sin (sine)', () => {
    it('should return undefined for undefined input', () => {
      expect(sin(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(sin(0)).toBe(0);
      expect(sin(Math.PI / 2)).toBeCloseTo(1);
      expect(sin(Math.PI)).toBeCloseTo(0);
      expect(sin(-Math.PI / 2)).toBeCloseTo(-1);
    });

    it('should handle special values', () => {
      expect(isNaN(sin(Infinity) as number)).toBe(true);
      expect(isNaN(sin(-Infinity) as number)).toBe(true);
      expect(isNaN(sin(NaN) as number)).toBe(true);
    });
  });

  describe('sinh (hyperbolic sine)', () => {
    it('should return undefined for undefined input', () => {
      expect(sinh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(sinh(0)).toBe(0);
      expect(sinh(1)).toBeCloseTo(Math.sinh(1));
      expect(sinh(-1)).toBeCloseTo(Math.sinh(-1));
    });

    it('should be anti-symmetric (odd function)', () => {
      expect(sinh(2)).toBeCloseTo(-(sinh(-2) as number));
      expect(sinh(5)).toBeCloseTo(-(sinh(-5) as number));
    });

    it('should handle special values', () => {
      expect(sinh(Infinity)).toBe(Infinity);
      expect(sinh(-Infinity)).toBe(-Infinity);
      expect(isNaN(sinh(NaN) as number)).toBe(true);
    });

    it('should work with fallback implementation', () => {
      const originalSinh = Math.sinh;
      delete (Math as any).sinh;

      expect(sinh(0)).toBeCloseTo(0);
      expect(sinh(1)).toBeCloseTo(originalSinh(1));
      expect(sinh(-1)).toBeCloseTo(originalSinh(-1));

      Math.sinh = originalSinh;
    });
  });

  describe('tan (tangent)', () => {
    it('should return undefined for undefined input', () => {
      expect(tan(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(tan(0)).toBe(0);
      expect(tan(Math.PI / 4)).toBeCloseTo(1);
      expect(tan(-Math.PI / 4)).toBeCloseTo(-1);
      expect(tan(Math.PI)).toBeCloseTo(0);
    });

    it('should handle special values', () => {
      expect(isNaN(tan(Infinity) as number)).toBe(true);
      expect(isNaN(tan(-Infinity) as number)).toBe(true);
      expect(isNaN(tan(NaN) as number)).toBe(true);
    });
  });

  describe('tanh (hyperbolic tangent)', () => {
    it('should return undefined for undefined input', () => {
      expect(tanh(undefined)).toBe(undefined);
    });

    it('should return correct values for valid inputs', () => {
      expect(tanh(0)).toBe(0);
      expect(tanh(1)).toBeCloseTo(Math.tanh(1));
      expect(tanh(-1)).toBeCloseTo(Math.tanh(-1));
    });

    it('should return 1 for Infinity', () => {
      expect(tanh(Infinity)).toBe(1);
    });

    it('should return -1 for -Infinity', () => {
      expect(tanh(-Infinity)).toBe(-1);
    });

    it('should approach 1 for large positive values', () => {
      expect(tanh(100)).toBeCloseTo(1);
      expect(tanh(1000)).toBeCloseTo(1);
    });

    it('should approach -1 for large negative values', () => {
      expect(tanh(-100)).toBeCloseTo(-1);
      expect(tanh(-1000)).toBeCloseTo(-1);
    });

    it('should be anti-symmetric (odd function)', () => {
      expect(tanh(2)).toBeCloseTo(-(tanh(-2) as number));
      expect(tanh(0.5)).toBeCloseTo(-(tanh(-0.5) as number));
    });

    it('should work with fallback implementation', () => {
      const originalTanh = Math.tanh;
      delete (Math as any).tanh;

      expect(tanh(0)).toBeCloseTo(0);
      expect(tanh(1)).toBeCloseTo(originalTanh(1));
      expect(tanh(-1)).toBeCloseTo(originalTanh(-1));
      expect(tanh(Infinity)).toBe(1);
      expect(tanh(-Infinity)).toBe(-1);

      Math.tanh = originalTanh;
    });
  });

  describe('Edge cases and comprehensive coverage', () => {
    it('should handle all functions with undefined input', () => {
      const functions = [
        acos, acosh, asin, asinh, atan, atanh,
        cos, cosh, sin, sinh, tan, tanh
      ];

      functions.forEach(fn => {
        expect(fn(undefined)).toBe(undefined);
      });
    });

    it('should handle all functions with zero', () => {
      expect(acos(0)).toBeCloseTo(Math.PI / 2);
      expect(asin(0)).toBe(0);
      expect(asinh(0)).toBe(0);
      expect(atan(0)).toBe(0);
      expect(atanh(0)).toBe(0);
      expect(cos(0)).toBe(1);
      expect(cosh(0)).toBe(1);
      expect(sin(0)).toBe(0);
      expect(sinh(0)).toBe(0);
      expect(tan(0)).toBe(0);
      expect(tanh(0)).toBe(0);
    });

    it('should handle NaN input for all functions', () => {
      const functions = [
        acos, acosh, asin, asinh, atan, atanh,
        cos, cosh, sin, sinh, tan, tanh
      ];

      functions.forEach(fn => {
        expect(isNaN(fn(NaN) as number)).toBe(true);
      });
    });
  });
});
