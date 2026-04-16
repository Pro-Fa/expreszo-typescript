import { describe, it, expect } from 'vitest';
import {
  add,
  addLegacy,
  sub,
  mul,
  div,
  divLegacy,
  mod,
  pow
} from '../../../src/operators/binary/arithmetic.js';

describe('Binary Arithmetic Operators', () => {
  describe('add', () => {
    describe('with numbers', () => {
      it('should add two positive numbers', () => {
        expect(add(2, 3)).toBe(5);
        expect(add(10, 20)).toBe(30);
      });

      it('should add two negative numbers', () => {
        expect(add(-2, -3)).toBe(-5);
        expect(add(-10, -20)).toBe(-30);
      });

      it('should add positive and negative numbers', () => {
        expect(add(5, -3)).toBe(2);
        expect(add(-5, 3)).toBe(-2);
      });

      it('should handle zero', () => {
        expect(add(0, 5)).toBe(5);
        expect(add(5, 0)).toBe(5);
        expect(add(0, 0)).toBe(0);
      });

      it('should handle floating point numbers', () => {
        expect(add(1.5, 2.5)).toBe(4);
        expect(add(0.1, 0.2)).toBeCloseTo(0.3);
      });

      it('should handle special numeric values', () => {
        expect(add(Infinity, 1)).toBe(Infinity);
        expect(add(-Infinity, 1)).toBe(-Infinity);
        expect(add(Infinity, -Infinity)).toBeNaN();
        expect(add(NaN, 1)).toBeNaN();
        expect(add(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(add(undefined, 5)).toBe(undefined);
        expect(add(undefined, 'hello')).toBe(undefined);
        expect(add(undefined, [1, 2])).toBe(undefined);
        expect(add(undefined, { a: 1 })).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(add(5, undefined)).toBe(undefined);
        expect(add('hello', undefined)).toBe(undefined);
        expect(add([1, 2], undefined)).toBe(undefined);
        expect(add({ a: 1 }, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(add(undefined, undefined)).toBe(undefined);
      });
    });

    describe('with strings', () => {
      it('should add numeric strings as numbers', () => {
        expect(add('2', '3')).toBe(5);
        expect(add('10', '20')).toBe(30);
        expect(add('1.5', '2.5')).toBe(4);
      });

      it('should add number and numeric string', () => {
        expect(add(2, '3')).toBe(5);
        expect(add('2', 3)).toBe(5);
      });

      it('should return NaN when string cannot be converted to number', () => {
        expect(add('hello', 'world')).toBeNaN();
        expect(add('hello', ' world')).toBeNaN();
      });

      it('should return NaN when one string is non-numeric', () => {
        expect(add('hello', 5)).toBeNaN();
        expect(add(5, 'hello')).toBeNaN();
        expect(add('abc', '123')).toBeNaN();
        expect(add('123', 'abc')).toBeNaN();
      });

      it('should handle empty strings', () => {
        expect(add('', '')).toBe(0); // Empty string converts to 0
        expect(add('', '5')).toBe(5);
        expect(add('5', '')).toBe(5);
        expect(add('', 'hello')).toBeNaN();
        expect(add('hello', '')).toBeNaN();
      });

      it('should handle whitespace strings', () => {
        expect(add('  ', '  ')).toBe(0); // Whitespace converts to 0
        expect(add('  5  ', '  3  ')).toBe(8);
      });
    });

    describe('with arrays', () => {
      it('should throw when adding two arrays', () => {
        expect(() => add([1, 2], [3, 4])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add(['a', 'b'], ['c', 'd'])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding empty arrays', () => {
        expect(() => add([], [])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add([1, 2], [])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add([], [3, 4])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding arrays with mixed types', () => {
        expect(() => add([1, 'a'], [true, null])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding nested arrays', () => {
        expect(() => add([[1, 2]], [[3, 4]])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });
    });

    describe('with objects', () => {
      it('should throw when adding two objects', () => {
        expect(() => add({ a: 1 }, { b: 2 })).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding empty objects', () => {
        expect(() => add({}, {})).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add({ a: 1 }, {})).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add({}, { b: 2 })).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding objects with overlapping keys', () => {
        expect(() => add({ a: 1, b: 2 }, { b: 3, c: 4 })).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw when adding nested objects', () => {
        expect(() => add({ a: { x: 1 } }, { b: { y: 2 } })).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });
    });

    describe('with incompatible types', () => {
      it('should throw error when adding number and array', () => {
        expect(() => add(5, [1, 2])).toThrow('Cannot add values of types: number and object. Use | for concatenation or merge() for objects.');
        expect(() => add([1, 2], 5)).toThrow('Cannot add values of types: object and number. Use | for concatenation or merge() for objects.');
      });

      it('should throw error when adding number and object', () => {
        expect(() => add(5, { a: 1 })).toThrow('Cannot add values of types: number and object. Use | for concatenation or merge() for objects.');
        expect(() => add({ a: 1 }, 5)).toThrow('Cannot add values of types: object and number. Use | for concatenation or merge() for objects.');
      });

      it('should throw error when adding array and object', () => {
        expect(() => add([1, 2], { a: 1 })).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
        expect(() => add({ a: 1 }, [1, 2])).toThrow('Cannot add values of types: object and object. Use | for concatenation or merge() for objects.');
      });

      it('should throw error when adding boolean and array', () => {
        expect(() => add(true, [1, 2])).toThrow('Cannot add values of types: boolean and object. Use | for concatenation or merge() for objects.');
        expect(() => add([1, 2], false)).toThrow('Cannot add values of types: object and boolean. Use | for concatenation or merge() for objects.');
      });

      it('should throw error when adding boolean and object', () => {
        expect(() => add(true, { a: 1 })).toThrow('Cannot add values of types: boolean and object. Use | for concatenation or merge() for objects.');
        expect(() => add({ a: 1 }, false)).toThrow('Cannot add values of types: object and boolean. Use | for concatenation or merge() for objects.');
      });
    });
  });

  describe('sub', () => {
    describe('with numbers', () => {
      it('should subtract two positive numbers', () => {
        expect(sub(5, 3)).toBe(2);
        expect(sub(20, 10)).toBe(10);
      });

      it('should subtract two negative numbers', () => {
        expect(sub(-5, -3)).toBe(-2);
        expect(sub(-10, -20)).toBe(10);
      });

      it('should subtract positive and negative numbers', () => {
        expect(sub(5, -3)).toBe(8);
        expect(sub(-5, 3)).toBe(-8);
      });

      it('should handle zero', () => {
        expect(sub(5, 0)).toBe(5);
        expect(sub(0, 5)).toBe(-5);
        expect(sub(0, 0)).toBe(0);
      });

      it('should handle floating point numbers', () => {
        expect(sub(5.5, 2.5)).toBe(3);
        expect(sub(0.3, 0.1)).toBeCloseTo(0.2);
      });

      it('should handle special numeric values', () => {
        expect(sub(Infinity, 1)).toBe(Infinity);
        expect(sub(-Infinity, 1)).toBe(-Infinity);
        expect(sub(Infinity, Infinity)).toBeNaN();
        expect(sub(NaN, 1)).toBeNaN();
        expect(sub(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(sub(undefined, 5)).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(sub(5, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(sub(undefined, undefined)).toBe(undefined);
      });
    });
  });

  describe('mul', () => {
    describe('with numbers', () => {
      it('should multiply two positive numbers', () => {
        expect(mul(2, 3)).toBe(6);
        expect(mul(10, 5)).toBe(50);
      });

      it('should multiply two negative numbers', () => {
        expect(mul(-2, -3)).toBe(6);
        expect(mul(-10, -5)).toBe(50);
      });

      it('should multiply positive and negative numbers', () => {
        expect(mul(5, -3)).toBe(-15);
        expect(mul(-5, 3)).toBe(-15);
      });

      it('should handle zero', () => {
        expect(mul(5, 0)).toBe(0);
        expect(mul(0, 5)).toBe(0);
        expect(mul(0, 0)).toBe(0);
      });

      it('should handle floating point numbers', () => {
        expect(mul(2.5, 2)).toBe(5);
        expect(mul(0.1, 0.2)).toBeCloseTo(0.02);
      });

      it('should handle special numeric values', () => {
        expect(mul(Infinity, 2)).toBe(Infinity);
        expect(mul(-Infinity, 2)).toBe(-Infinity);
        expect(mul(Infinity, 0)).toBeNaN();
        expect(mul(NaN, 1)).toBeNaN();
        expect(mul(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(mul(undefined, 5)).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(mul(5, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(mul(undefined, undefined)).toBe(undefined);
      });
    });
  });

  describe('div', () => {
    describe('with numbers', () => {
      it('should divide two positive numbers', () => {
        expect(div(6, 3)).toBe(2);
        expect(div(20, 5)).toBe(4);
      });

      it('should divide two negative numbers', () => {
        expect(div(-6, -3)).toBe(2);
        expect(div(-20, -5)).toBe(4);
      });

      it('should divide positive and negative numbers', () => {
        expect(div(6, -3)).toBe(-2);
        expect(div(-6, 3)).toBe(-2);
      });

      it('should throw on division by zero', () => {
        expect(() => div(5, 0)).toThrow('Division by zero');
        expect(() => div(-5, 0)).toThrow('Division by zero');
        expect(() => div(0, 0)).toThrow('Division by zero');
      });

      it('should handle division of zero', () => {
        expect(div(0, 5)).toBe(0);
      });

      it('should handle floating point numbers', () => {
        expect(div(5, 2)).toBe(2.5);
        expect(div(0.6, 0.3)).toBeCloseTo(2);
      });

      it('should handle special numeric values', () => {
        expect(div(Infinity, 2)).toBe(Infinity);
        expect(div(-Infinity, 2)).toBe(-Infinity);
        expect(div(Infinity, Infinity)).toBeNaN();
        expect(div(NaN, 1)).toBeNaN();
        expect(div(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(div(undefined, 5)).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(div(5, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(div(undefined, undefined)).toBe(undefined);
      });
    });
  });

  describe('mod', () => {
    describe('with numbers', () => {
      it('should calculate modulo of two positive numbers', () => {
        expect(mod(5, 3)).toBe(2);
        expect(mod(10, 4)).toBe(2);
        expect(mod(7, 7)).toBe(0);
      });

      it('should calculate modulo with negative numbers', () => {
        expect(mod(-5, 3)).toBe(-2);
        expect(mod(5, -3)).toBe(2);
        expect(mod(-5, -3)).toBe(-2);
      });

      it('should handle zero dividend', () => {
        expect(mod(0, 5)).toBe(0);
      });

      it('should handle zero divisor', () => {
        expect(mod(5, 0)).toBeNaN();
      });

      it('should handle floating point numbers', () => {
        expect(mod(5.5, 2)).toBeCloseTo(1.5);
        expect(mod(10.5, 3)).toBeCloseTo(1.5);
      });

      it('should handle special numeric values', () => {
        expect(mod(Infinity, 2)).toBeNaN();
        expect(mod(5, Infinity)).toBe(5);
        expect(mod(NaN, 1)).toBeNaN();
        expect(mod(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(mod(undefined, 5)).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(mod(5, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(mod(undefined, undefined)).toBe(undefined);
      });
    });
  });

  describe('pow', () => {
    describe('with numbers', () => {
      it('should calculate power of two positive numbers', () => {
        expect(pow(2, 3)).toBe(8);
        expect(pow(10, 2)).toBe(100);
        expect(pow(5, 0)).toBe(1);
      });

      it('should handle negative exponents', () => {
        expect(pow(2, -1)).toBe(0.5);
        expect(pow(10, -2)).toBe(0.01);
      });

      it('should handle negative base', () => {
        expect(pow(-2, 3)).toBe(-8);
        expect(pow(-2, 2)).toBe(4);
      });

      it('should handle zero base', () => {
        expect(pow(0, 5)).toBe(0);
        expect(pow(0, 0)).toBe(1);
      });

      it('should handle floating point numbers', () => {
        expect(pow(2.5, 2)).toBe(6.25);
        expect(pow(4, 0.5)).toBe(2);
      });

      it('should handle special numeric values', () => {
        expect(pow(Infinity, 2)).toBe(Infinity);
        expect(pow(2, Infinity)).toBe(Infinity);
        expect(pow(0, -1)).toBe(Infinity);
        expect(pow(NaN, 1)).toBeNaN();
        expect(pow(1, NaN)).toBeNaN();
      });
    });

    describe('with undefined', () => {
      it('should return undefined when first operand is undefined', () => {
        expect(pow(undefined, 5)).toBe(undefined);
      });

      it('should return undefined when second operand is undefined', () => {
        expect(pow(5, undefined)).toBe(undefined);
      });

      it('should return undefined when both operands are undefined', () => {
        expect(pow(undefined, undefined)).toBe(undefined);
      });
    });
  });

  describe('addLegacy', () => {
    it('should add two numbers', () => {
      expect(addLegacy(2, 3)).toBe(5);
    });

    it('should return undefined when either operand is undefined', () => {
      expect(addLegacy(undefined, 3)).toBe(undefined);
      expect(addLegacy(2, undefined)).toBe(undefined);
      expect(addLegacy(undefined, undefined)).toBe(undefined);
    });

    it('should add numeric strings as numbers', () => {
      expect(addLegacy('2', '3')).toBe(5);
    });

    it('should concatenate non-numeric strings (deprecation warning)', () => {
      expect(addLegacy('hello', 'world')).toBe('helloworld');
    });

    it('should concatenate number and non-numeric string (deprecation warning)', () => {
      expect(addLegacy(5, 'hello')).toBe('5hello');
    });

    it('should concatenate arrays (deprecation warning)', () => {
      expect(addLegacy([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
    });

    it('should merge objects (deprecation warning)', () => {
      expect(addLegacy({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should throw for incompatible types', () => {
      expect(() => addLegacy(5, [1, 2])).toThrow('Cannot add values of incompatible types: number and object');
    });
  });

  describe('divLegacy', () => {
    it('should divide two numbers', () => {
      expect(divLegacy(6, 3)).toBe(2);
    });

    it('should return undefined when either operand is undefined', () => {
      expect(divLegacy(undefined, 3)).toBe(undefined);
      expect(divLegacy(6, undefined)).toBe(undefined);
      expect(divLegacy(undefined, undefined)).toBe(undefined);
    });

    it('should return Infinity for division by zero (deprecation warning)', () => {
      expect(divLegacy(5, 0)).toBe(Infinity);
    });

    it('should return -Infinity for negative division by zero', () => {
      expect(divLegacy(-5, 0)).toBe(-Infinity);
    });

    it('should return NaN for 0/0', () => {
      expect(divLegacy(0, 0)).toBeNaN();
    });
  });
});
