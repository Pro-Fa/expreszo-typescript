import { describe, it, expect } from 'vitest';
import {
  concat,
  concatLegacy,
  setVar,
  arrayIndexOrProperty,
  coalesce,
  asOperator
} from '../../../src/operators/binary/utility.js';
import { AccessError } from '../../../src/types/errors.js';

describe('Binary Utility Operators', () => {
  describe('concat', () => {
    describe('with arrays', () => {
      it('should concatenate two arrays', () => {
        expect(concat([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
      });

      it('should concatenate empty arrays', () => {
        expect(concat([], [])).toEqual([]);
        expect(concat([1, 2], [])).toEqual([1, 2]);
        expect(concat([], [3, 4])).toEqual([3, 4]);
      });

      it('should concatenate arrays with mixed types', () => {
        expect(concat([1, 'a'], [true, null])).toEqual([1, 'a', true, null]);
      });

      it('should concatenate nested arrays', () => {
        expect(concat([[1, 2]], [[3, 4]])).toEqual([[1, 2], [3, 4]]);
      });
    });

    describe('with strings', () => {
      it('should concatenate two strings', () => {
        expect(concat('hello', ' world')).toBe('hello world');
      });

      it('should concatenate empty strings', () => {
        expect(concat('', '')).toBe('');
        expect(concat('hello', '')).toBe('hello');
        expect(concat('', 'world')).toBe('world');
      });
    });

    describe('with mixed string and non-string types', () => {
      it('should concatenate string and number', () => {
        expect(concat('value: ', 42)).toBe('value: 42');
        expect(concat(42, ' items')).toBe('42 items');
      });

      it('should concatenate string and boolean', () => {
        expect(concat('is: ', true)).toBe('is: true');
        expect(concat(false, ' flag')).toBe('false flag');
      });
    });

    describe('with non-string, non-array types', () => {
      it('should return undefined for two numbers', () => {
        expect(concat(42, 43)).toBeUndefined();
      });

      it('should return undefined for two booleans', () => {
        expect(concat(true, false)).toBeUndefined();
      });

      it('should return undefined for null values', () => {
        expect(concat(null, null)).toBeUndefined();
      });
    });
  });

  describe('concatLegacy', () => {
    describe('with arrays', () => {
      it('should concatenate two arrays', () => {
        expect(concatLegacy([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
      });

      it('should concatenate empty arrays', () => {
        expect(concatLegacy([], [])).toEqual([]);
        expect(concatLegacy([1], [])).toEqual([1]);
        expect(concatLegacy([], [2])).toEqual([2]);
      });
    });

    describe('with strings', () => {
      it('should concatenate two strings', () => {
        expect(concatLegacy('hello', ' world')).toBe('hello world');
      });

      it('should concatenate empty strings', () => {
        expect(concatLegacy('', '')).toBe('');
        expect(concatLegacy('a', '')).toBe('a');
        expect(concatLegacy('', 'b')).toBe('b');
      });
    });

    describe('with non-array, non-string types', () => {
      it('should return undefined for two numbers', () => {
        expect(concatLegacy(42, 43)).toBeUndefined();
      });

      it('should return undefined for number and string (only both-string works)', () => {
        expect(concatLegacy(42, 'hello')).toBeUndefined();
        expect(concatLegacy('hello', 42)).toBeUndefined();
      });

      it('should return undefined for booleans', () => {
        expect(concatLegacy(true, false)).toBeUndefined();
      });

      it('should return undefined for null values', () => {
        expect(concatLegacy(null, null)).toBeUndefined();
      });
    });
  });

  describe('setVar', () => {
    it('should set a variable and return the value', () => {
      const vars: Record<string, any> = {};
      const result = setVar('x', 42, vars);
      expect(result).toBe(42);
      expect(vars.x).toBe(42);
    });

    it('should overwrite an existing variable', () => {
      const vars: Record<string, any> = { x: 10 };
      const result = setVar('x', 20, vars);
      expect(result).toBe(20);
      expect(vars.x).toBe(20);
    });

    it('should return the value even when variables is undefined', () => {
      const result = setVar('x', 42, undefined);
      expect(result).toBe(42);
    });

    it('should handle various value types', () => {
      const vars: Record<string, any> = {};

      setVar('str', 'hello', vars);
      expect(vars.str).toBe('hello');

      setVar('arr', [1, 2, 3], vars);
      expect(vars.arr).toEqual([1, 2, 3]);

      setVar('obj', { a: 1 }, vars);
      expect(vars.obj).toEqual({ a: 1 });

      setVar('nil', null, vars);
      expect(vars.nil).toBeNull();

      setVar('undef', undefined, vars);
      expect(vars.undef).toBeUndefined();
    });

    describe('dangerous properties', () => {
      it('should throw AccessError for __proto__', () => {
        const vars: Record<string, any> = {};
        expect(() => setVar('__proto__', {}, vars)).toThrow(AccessError);
        expect(() => setVar('__proto__', {}, vars)).toThrow('Prototype access detected in assignment');
      });

      it('should throw AccessError for prototype', () => {
        const vars: Record<string, any> = {};
        expect(() => setVar('prototype', {}, vars)).toThrow(AccessError);
      });

      it('should throw AccessError for constructor', () => {
        const vars: Record<string, any> = {};
        expect(() => setVar('constructor', {}, vars)).toThrow(AccessError);
      });

      it('should throw AccessError for dangerous properties even with undefined variables', () => {
        expect(() => setVar('__proto__', {}, undefined)).toThrow(AccessError);
      });
    });
  });

  describe('arrayIndexOrProperty', () => {
    describe('array access with integer index', () => {
      it('should access array elements by index', () => {
        const arr = [10, 20, 30];
        expect(arrayIndexOrProperty(arr, 0)).toBe(10);
        expect(arrayIndexOrProperty(arr, 1)).toBe(20);
        expect(arrayIndexOrProperty(arr, 2)).toBe(30);
      });

      it('should return undefined for out-of-bounds index', () => {
        const arr = [10, 20, 30];
        expect(arrayIndexOrProperty(arr, 5)).toBeUndefined();
        expect(arrayIndexOrProperty(arr, -1)).toBeUndefined();
      });
    });

    describe('object access with string key', () => {
      it('should access object properties by string key', () => {
        const obj = { name: 'Alice', age: 30 };
        expect(arrayIndexOrProperty(obj, 'name')).toBe('Alice');
        expect(arrayIndexOrProperty(obj, 'age')).toBe(30);
      });

      it('should return undefined for non-existent key', () => {
        const obj = { name: 'Alice' };
        expect(arrayIndexOrProperty(obj, 'missing')).toBeUndefined();
      });
    });

    describe('array access with string index', () => {
      it('should throw for string index on array (strings are not integers)', () => {
        const arr = [10, 20, 30];
        expect(() => arrayIndexOrProperty(arr, '0')).toThrow(
          'Array can only be indexed with integers'
        );
        expect(() => arrayIndexOrProperty(arr, '1')).toThrow(
          'Array can only be indexed with integers'
        );
      });

      it('should throw for non-numeric string on array', () => {
        const arr = [10, 20, 30];
        expect(() => arrayIndexOrProperty(arr, 'foo')).toThrow(
          'Array can only be indexed with integers'
        );
      });
    });

    describe('undefined parent or index', () => {
      it('should return undefined when parent is undefined', () => {
        expect(arrayIndexOrProperty(undefined, 0)).toBeUndefined();
        expect(arrayIndexOrProperty(undefined, 'key')).toBeUndefined();
      });

      it('should return undefined when index is undefined', () => {
        expect(arrayIndexOrProperty([1, 2], undefined)).toBeUndefined();
        expect(arrayIndexOrProperty({ a: 1 }, undefined)).toBeUndefined();
      });

      it('should return undefined when both are undefined', () => {
        expect(arrayIndexOrProperty(undefined, undefined)).toBeUndefined();
      });
    });

    describe('non-number/non-string index', () => {
      it('should return undefined for boolean index', () => {
        expect(arrayIndexOrProperty([1, 2, 3], true as any)).toBeUndefined();
        expect(arrayIndexOrProperty([1, 2, 3], false as any)).toBeUndefined();
      });

      it('should return undefined for object index', () => {
        expect(arrayIndexOrProperty([1, 2, 3], {} as any)).toBeUndefined();
      });

      it('should return undefined for array index', () => {
        expect(arrayIndexOrProperty([1, 2, 3], [0] as any)).toBeUndefined();
      });

      it('should return undefined for null index', () => {
        expect(arrayIndexOrProperty([1, 2, 3], null as any)).toBeUndefined();
      });
    });

    describe('dangerous properties', () => {
      it('should throw AccessError for __proto__ access', () => {
        expect(() => arrayIndexOrProperty({}, '__proto__')).toThrow(AccessError);
        expect(() => arrayIndexOrProperty({}, '__proto__')).toThrow('Prototype access detected in bracket expression');
      });

      it('should throw AccessError for prototype access', () => {
        expect(() => arrayIndexOrProperty({}, 'prototype')).toThrow(AccessError);
      });

      it('should throw AccessError for constructor access', () => {
        expect(() => arrayIndexOrProperty({}, 'constructor')).toThrow(AccessError);
      });
    });

    describe('array with non-integer index', () => {
      it('should throw error for float index on array', () => {
        expect(() => arrayIndexOrProperty([1, 2, 3], 1.5)).toThrow(
          'Array can only be indexed with integers, got 1.5. Use round() or floor() to convert: array[floor(index)]'
        );
      });

      it('should throw error for NaN index on array', () => {
        expect(() => arrayIndexOrProperty([1, 2, 3], NaN)).toThrow(
          'Array can only be indexed with integers'
        );
      });

      it('should not throw for integer index on array', () => {
        expect(arrayIndexOrProperty([10, 20, 30], 0)).toBe(10);
        expect(arrayIndexOrProperty([10, 20, 30], 2)).toBe(30);
      });
    });
  });

  describe('coalesce', () => {
    it('should return fallback when first value is undefined', () => {
      expect(coalesce(undefined, 'fallback')).toBe('fallback');
    });

    it('should return fallback when first value is null', () => {
      expect(coalesce(null, 'fallback')).toBe('fallback');
    });

    it('should return fallback when first value is Infinity', () => {
      expect(coalesce(Infinity, 'fallback')).toBe('fallback');
    });

    it('should return fallback when first value is NaN', () => {
      expect(coalesce(NaN, 'fallback')).toBe('fallback');
    });

    it('should return 0 when first value is 0', () => {
      expect(coalesce(0, 'fallback')).toBe(0);
    });

    it('should return empty string when first value is empty string', () => {
      expect(coalesce('', 'fallback')).toBe('');
    });

    it('should return false when first value is false', () => {
      expect(coalesce(false, 'fallback')).toBe(false);
    });

    it('should return fallback for non-numeric strings (isNaN coerces to NaN)', () => {
      expect(coalesce('hello', 'fallback')).toBe('fallback');
    });

    it('should return numeric string when it is valid', () => {
      // isNaN('42') is false because '42' coerces to 42
      expect(coalesce('42', 'fallback')).toBe('42');
    });

    it('should return first value when it is a valid number', () => {
      expect(coalesce(42, 'fallback')).toBe(42);
      expect(coalesce(-1, 0)).toBe(-1);
    });

    it('should return fallback for arrays (isNaN coerces array to NaN)', () => {
      expect(coalesce([1, 2], 'fallback')).toBe('fallback');
    });

    it('should return fallback for objects (isNaN coerces object to NaN)', () => {
      expect(coalesce({ a: 1 }, 'fallback')).toBe('fallback');
    });

    it('should return -Infinity (not caught by === Infinity or isNaN)', () => {
      // -Infinity !== Infinity, and isNaN(-Infinity) is false
      expect(coalesce(-Infinity, 'fallback')).toBe(-Infinity);
    });
  });

  describe('asOperator', () => {
    describe('conversion to boolean', () => {
      it('should convert truthy values to true', () => {
        expect(asOperator(1, 'boolean')).toBe(true);
        expect(asOperator('hello', 'boolean')).toBe(true);
        expect(asOperator([1], 'boolean')).toBe(true);
      });

      it('should convert falsy values to false', () => {
        expect(asOperator(0, 'boolean')).toBe(false);
        expect(asOperator('', 'boolean')).toBe(false);
        expect(asOperator(null, 'boolean')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(asOperator(1, 'Boolean')).toBe(true);
        expect(asOperator(1, 'BOOLEAN')).toBe(true);
      });
    });

    describe('conversion to int/integer', () => {
      it('should convert with "int" keyword', () => {
        expect(asOperator(3.14, 'int')).toBe(3);
        expect(asOperator(3.7, 'int')).toBe(4);
        expect(asOperator(-2.3, 'int')).toBe(-2);
      });

      it('should convert with "integer" keyword', () => {
        expect(asOperator(3.14, 'integer')).toBe(3);
        expect(asOperator(3.7, 'integer')).toBe(4);
      });

      it('should convert string numbers to integers', () => {
        expect(asOperator('42', 'int')).toBe(42);
        expect(asOperator('3.14', 'int')).toBe(3);
      });

      it('should be case-insensitive', () => {
        expect(asOperator(3.14, 'INT')).toBe(3);
        expect(asOperator(3.14, 'Integer')).toBe(3);
      });
    });

    describe('conversion to number', () => {
      it('should convert string numbers', () => {
        expect(asOperator('42', 'number')).toBe(42);
        expect(asOperator('3.14', 'number')).toBe(3.14);
      });

      it('should convert booleans to numbers', () => {
        expect(asOperator(true, 'number')).toBe(1);
        expect(asOperator(false, 'number')).toBe(0);
      });

      it('should return NaN for non-numeric strings', () => {
        expect(asOperator('hello', 'number')).toBeNaN();
      });

      it('should be case-insensitive', () => {
        expect(asOperator('42', 'Number')).toBe(42);
        expect(asOperator('42', 'NUMBER')).toBe(42);
      });
    });

    describe('with undefined values', () => {
      it('should return undefined when first argument is undefined', () => {
        expect(asOperator(undefined, 'number')).toBeUndefined();
      });

      it('should return undefined when second argument is undefined', () => {
        expect(asOperator(42, undefined)).toBeUndefined();
      });

      it('should return undefined when both arguments are undefined', () => {
        expect(asOperator(undefined, undefined)).toBeUndefined();
      });
    });

    describe('with unknown type', () => {
      it('should throw error for unsupported type', () => {
        expect(() => asOperator(42, 'date')).toThrow(
          'Cannot convert to unknown type \'date\'. Supported types: \'number\', \'int\'/\'integer\', \'boolean\'. Example: "3.14" as "number"'
        );
      });

      it('should throw error for arbitrary string type', () => {
        expect(() => asOperator(42, 'float')).toThrow('Cannot convert to unknown type');
      });

      it('should throw error for empty string type', () => {
        expect(() => asOperator(42, '')).toThrow('Cannot convert to unknown type');
      });
    });
  });
});
