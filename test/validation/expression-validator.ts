import { describe, it, expect } from 'vitest';
import { ExpressionValidator, DANGEROUS_PROPERTIES } from '../../src/validation/expression-validator.js';
import { AccessError, FunctionError } from '../../src/types/errors.js';

describe('ExpressionValidator', () => {
  describe('validateRequiredParameter()', () => {
    it('should throw when value is undefined', () => {
      expect(() => ExpressionValidator.validateRequiredParameter(undefined, 'x')).toThrow(
        "Required parameter 'x' is missing"
      );
    });

    it('should throw when value is null', () => {
      expect(() => ExpressionValidator.validateRequiredParameter(null, 'x')).toThrow(
        "Required parameter 'x' is missing"
      );
    });

    it('should include the parameter name in the error message', () => {
      expect(() => ExpressionValidator.validateRequiredParameter(undefined, 'myParam')).toThrow(
        "Required parameter 'myParam' is missing"
      );
    });

    it('should not throw for a string value', () => {
      expect(() => ExpressionValidator.validateRequiredParameter('value', 'x')).not.toThrow();
    });

    it('should not throw for numeric zero', () => {
      expect(() => ExpressionValidator.validateRequiredParameter(0, 'x')).not.toThrow();
    });

    it('should not throw for an empty string', () => {
      expect(() => ExpressionValidator.validateRequiredParameter('', 'x')).not.toThrow();
    });

    it('should not throw for false', () => {
      expect(() => ExpressionValidator.validateRequiredParameter(false, 'x')).not.toThrow();
    });

    it('should not throw for an object', () => {
      expect(() => ExpressionValidator.validateRequiredParameter({}, 'x')).not.toThrow();
    });
  });

  describe('validateStackParity()', () => {
    it('should not throw for stack length 0', () => {
      expect(() => ExpressionValidator.validateStackParity(0)).not.toThrow();
    });

    it('should not throw for stack length 1', () => {
      expect(() => ExpressionValidator.validateStackParity(1)).not.toThrow();
    });

    it('should throw for stack length 2', () => {
      expect(() => ExpressionValidator.validateStackParity(2)).toThrow(
        /Malformed expression: evaluation produced multiple values instead of one/
      );
    });

    it('should throw for stack length 5', () => {
      expect(() => ExpressionValidator.validateStackParity(5)).toThrow(
        /Malformed expression: evaluation produced multiple values instead of one/
      );
    });

    it('should include guidance about missing operators in the error', () => {
      expect(() => ExpressionValidator.validateStackParity(3)).toThrow(
        /missing operators between terms/
      );
    });
  });

  describe('validateVariableName()', () => {
    it('should throw AccessError for __proto__', () => {
      expect(() => ExpressionValidator.validateVariableName('__proto__', 'x.__proto__')).toThrow(
        AccessError
      );
      expect(() => ExpressionValidator.validateVariableName('__proto__', 'x.__proto__')).toThrow(
        /Prototype access detected/
      );
    });

    it('should throw AccessError for constructor', () => {
      expect(() => ExpressionValidator.validateVariableName('constructor', 'x.constructor')).toThrow(
        AccessError
      );
    });

    it('should throw AccessError for prototype', () => {
      expect(() => ExpressionValidator.validateVariableName('prototype', 'x.prototype')).toThrow(
        AccessError
      );
    });

    it('should not throw for safe variable names', () => {
      expect(() => ExpressionValidator.validateVariableName('myVar', 'myVar + 1')).not.toThrow();
      expect(() => ExpressionValidator.validateVariableName('x', 'x + y')).not.toThrow();
      expect(() => ExpressionValidator.validateVariableName('data', 'data.length')).not.toThrow();
    });
  });

  describe('validateMemberAccess()', () => {
    it('should throw AccessError for __proto__', () => {
      expect(() => ExpressionValidator.validateMemberAccess('__proto__', 'obj.__proto__')).toThrow(
        AccessError
      );
      expect(() => ExpressionValidator.validateMemberAccess('__proto__', 'obj.__proto__')).toThrow(
        /Prototype access detected in member expression/
      );
    });

    it('should throw AccessError for constructor', () => {
      expect(() => ExpressionValidator.validateMemberAccess('constructor', 'obj.constructor')).toThrow(
        AccessError
      );
    });

    it('should throw AccessError for prototype', () => {
      expect(() => ExpressionValidator.validateMemberAccess('prototype', 'Foo.prototype')).toThrow(
        AccessError
      );
    });

    it('should not throw for safe property names', () => {
      expect(() => ExpressionValidator.validateMemberAccess('name', 'obj.name')).not.toThrow();
      expect(() => ExpressionValidator.validateMemberAccess('length', 'arr.length')).not.toThrow();
    });
  });

  describe('validateFunctionCall()', () => {
    it('should not throw for a function value', () => {
      expect(() => ExpressionValidator.validateFunctionCall(() => 1, 'myFn', 'myFn()')).not.toThrow();
    });

    it('should throw FunctionError for undefined function', () => {
      expect(() => ExpressionValidator.validateFunctionCall(undefined, 'myFn', 'myFn()')).toThrow(
        FunctionError
      );
      expect(() => ExpressionValidator.validateFunctionCall(undefined, 'myFn', 'myFn()')).toThrow(
        /myFn is not defined/
      );
    });

    it('should throw FunctionError for non-function value', () => {
      expect(() => ExpressionValidator.validateFunctionCall(42, 'myFn', 'myFn()')).toThrow(
        FunctionError
      );
      expect(() => ExpressionValidator.validateFunctionCall(42, 'myFn', 'myFn()')).toThrow(
        /myFn is not a function/
      );
    });

    it('should throw FunctionError for string value', () => {
      expect(() => ExpressionValidator.validateFunctionCall('not a fn', 'myFn', 'myFn()')).toThrow(
        /myFn is not a function \(got string\)/
      );
    });
  });

  describe('isAllowedFunction()', () => {
    it('should return true for non-function values', () => {
      expect(ExpressionValidator.isAllowedFunction(42, {})).toBe(true);
      expect(ExpressionValidator.isAllowedFunction('hello', {})).toBe(true);
      expect(ExpressionValidator.isAllowedFunction(null, {})).toBe(true);
    });

    it('should return true for safe native functions like Math.max', () => {
      expect(ExpressionValidator.isAllowedFunction(Math.max, {})).toBe(true);
      expect(ExpressionValidator.isAllowedFunction(Math.min, {})).toBe(true);
      expect(ExpressionValidator.isAllowedFunction(Math.abs, {})).toBe(true);
    });

    it('should return true for registered functions', () => {
      const myFn = () => 42;
      const registered = { myFn };
      expect(ExpressionValidator.isAllowedFunction(myFn, registered)).toBe(true);
    });

    it('should return false for unregistered arbitrary functions', () => {
      const evil = () => { /* malicious */ };
      expect(ExpressionValidator.isAllowedFunction(evil, {})).toBe(false);
    });
  });

  describe('validateAllowedFunction()', () => {
    it('should not throw for non-function values', () => {
      expect(() => ExpressionValidator.validateAllowedFunction(42, {}, 'expr')).not.toThrow();
    });

    it('should not throw for registered functions', () => {
      const fn = () => 1;
      expect(() => ExpressionValidator.validateAllowedFunction(fn, { fn }, 'fn()')).not.toThrow();
    });

    it('should throw FunctionError for unregistered functions', () => {
      const evil = () => { /* unregistered */ };
      expect(() => ExpressionValidator.validateAllowedFunction(evil, {}, 'evil()')).toThrow(
        FunctionError
      );
      expect(() => ExpressionValidator.validateAllowedFunction(evil, {}, 'evil()')).toThrow(
        /Calling unregistered functions is not allowed/
      );
    });
  });

  describe('validateArrayAccess()', () => {
    it('should not throw for integer index on array', () => {
      expect(() => ExpressionValidator.validateArrayAccess([1, 2, 3], 1)).not.toThrow();
    });

    it('should throw for non-integer index on array', () => {
      expect(() => ExpressionValidator.validateArrayAccess([1, 2, 3], 1.5)).toThrow(
        /Array can only be indexed with integers/
      );
    });

    it('should not throw for non-array parent', () => {
      expect(() => ExpressionValidator.validateArrayAccess({ a: 1 }, 'a')).not.toThrow();
    });
  });

  describe('DANGEROUS_PROPERTIES', () => {
    it('should contain __proto__, prototype, and constructor', () => {
      expect(DANGEROUS_PROPERTIES.has('__proto__')).toBe(true);
      expect(DANGEROUS_PROPERTIES.has('prototype')).toBe(true);
      expect(DANGEROUS_PROPERTIES.has('constructor')).toBe(true);
    });

    it('should not contain safe property names', () => {
      expect(DANGEROUS_PROPERTIES.has('name')).toBe(false);
      expect(DANGEROUS_PROPERTIES.has('length')).toBe(false);
    });
  });
});
