/**
 * Security tests for CVE-2025-12735, CVE-2025-13204, and related vulnerabilities
 *
 * These tests verify that the library is protected against:
 * 1. CVE-2025-12735: Code injection via arbitrary function calls in evaluation context
 * 2. CVE-2025-13204: Prototype pollution via __proto__, prototype, constructor access
 * 3. Bypass vulnerabilities via member function calls (Issue #289)
 * 4. Prototype pollution via assignment operator
 * 5. Prototype pollution via bracket notation bypass
 * 6. Prototype pollution via object literal property keys
 * 7. String escape parsing (double-backslash before quote)
 * 8. Parser recursion depth limits (stack overflow DoS)
 * 9. Input length limits
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../../index';
import { AccessError, FunctionError, ParseError } from '../../src/types/errors';
// ParseError is used by recursion depth tests

describe('Security Tests', () => {
  describe('CVE-2025-12735: Code Injection Prevention', () => {
    it('should block direct function calls passed via context', () => {
      const parser = new Parser();
      const dangerousContext = {
        dangerousFunc: () => 'pwned'
      };

      expect(() => parser.evaluate('dangerousFunc()', dangerousContext))
        .toThrow(FunctionError);
    });

    it('should block variable access to functions passed via context', () => {
      const parser = new Parser();
      const dangerousContext = {
        exec: () => 'pwned'
      };

      expect(() => parser.evaluate('exec("whoami")', dangerousContext))
        .toThrow(FunctionError);
    });

    it('should allow registered functions in parser.functions', () => {
      const parser = new Parser();
      parser.functions.safeFunc = (x: number) => x * 2;

      expect(parser.evaluate('safeFunc(5)')).toBe(10);
    });

    it('should allow safe Math functions', () => {
      const parser = new Parser();

      expect(parser.evaluate('sin(0)')).toBe(0);
      expect(parser.evaluate('cos(0)')).toBe(1);
      expect(parser.evaluate('abs(-5)')).toBe(5);
      expect(parser.evaluate('sqrt(4)')).toBe(2);
      expect(parser.evaluate('pow(2, 3)')).toBe(8);
    });

    it('should allow inline-defined functions (IFUNDEF)', () => {
      const parser = new Parser();

      expect(parser.evaluate('(f(x) = x * 2)(5)')).toBe(10);
      expect(parser.evaluate('f(x) = x * x; f(4)')).toBe(16);
    });

    it('should allow recursive inline functions', () => {
      const parser = new Parser();

      // Factorial function
      expect(parser.evaluate('(f(x) = x > 1 ? x * f(x - 1) : 1)(5)')).toBe(120);
    });
  });

  describe('CVE-2025-13204: Prototype Pollution Prevention', () => {
    it('should block __proto__ access in member expressions', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('x.__proto__', { x: {} }))
        .toThrow(AccessError);
    });

    it('should block prototype access in member expressions', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('x.prototype', { x: function (): number { return 0; } }))
        .toThrow(); // Can throw AccessError or FunctionError depending on the function check
    });

    it('should block __proto__ access in variable names', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('__proto__', { '__proto__': {} }))
        .toThrow(AccessError);
    });

    it('should block prototype access in variable names', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('prototype', { prototype: {} }))
        .toThrow(AccessError);
    });

    it('should block constructor access in variable names', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('constructor', { constructor: {} }))
        .toThrow();
    });
  });

  describe('Issue #289: Member Function Call Bypass Prevention', () => {
    it('should block member function calls on nested objects', () => {
      const parser = new Parser();
      const dangerousContext = {
        obj: {
          dangerousMethod: () => 'pwned via member'
        }
      };

      expect(() => parser.evaluate('obj.dangerousMethod()', dangerousContext))
        .toThrow(FunctionError);
    });

    it('should block deeply nested dangerous function calls', () => {
      const parser = new Parser();
      const dangerousContext = {
        level1: {
          level2: {
            exec: () => 'pwned deeply'
          }
        }
      };

      expect(() => parser.evaluate('level1.level2.exec()', dangerousContext))
        .toThrow(FunctionError);
    });

    it('should allow safe member access on objects', () => {
      const parser = new Parser();
      const safeContext = {
        user: {
          name: 'John',
          age: 30
        }
      };

      expect(parser.evaluate('user.name', safeContext)).toBe('John');
      expect(parser.evaluate('user.age', safeContext)).toBe(30);
    });

    it('should allow safe nested member access', () => {
      const parser = new Parser();
      const safeContext = {
        data: {
          info: {
            value: 42
          }
        }
      };

      expect(parser.evaluate('data.info.value', safeContext)).toBe(42);
    });
  });

  describe('PoC Attacks from Security Reports', () => {
    it('PoC: VU#263614 - deny child exec process', () => {
      const parser = new Parser();
      const context = {
        exec: () => 'executed'
      };

      expect(() => parser.evaluate('exec("whoami")', context))
        .toThrow(FunctionError);
    });

    it('PoC: Issue #289 by @baoquanh - nested dangerous function', () => {
      const parser = new Parser();
      const baoquanh = {
        test: {
          write: () => 'file written'
        }
      };

      expect(() => parser.evaluate('test.write("pwned.txt", "Hello!")', baoquanh))
        .toThrow(FunctionError);
    });

    it('PoC: write file via context - should be blocked', () => {
      const parser = new Parser();
      const context = {
        write: () => 'wrote file'
      };

      expect(() => parser.evaluate('write("pwned.txt", "Hello!")', context))
        .toThrow(FunctionError);
    });
  });

  describe('Safe Operations', () => {
    it('should still allow normal arithmetic expressions', () => {
      const parser = new Parser();

      expect(parser.evaluate('2 + 3')).toBe(5);
      expect(parser.evaluate('10 - 5')).toBe(5);
      expect(parser.evaluate('4 * 5')).toBe(20);
      expect(parser.evaluate('20 / 4')).toBe(5);
    });

    it('should still allow variables with primitive values', () => {
      const parser = new Parser();

      expect(parser.evaluate('x + y', { x: 10, y: 20 })).toBe(30);
      expect(parser.evaluate('name', { name: 'test' })).toBe('test');
      expect(parser.evaluate('flag', { flag: true })).toBe(true);
    });

    it('should still allow array access', () => {
      const parser = new Parser();

      expect(parser.evaluate('arr[0]', { arr: [1, 2, 3] })).toBe(1);
      expect(parser.evaluate('arr[1] + arr[2]', { arr: [1, 2, 3] })).toBe(5);
    });

    it('should still allow built-in functions', () => {
      const parser = new Parser();

      expect(parser.evaluate('min(5, 3)')).toBe(3);
      expect(parser.evaluate('max(5, 3)')).toBe(5);
      expect(parser.evaluate('floor(3.7)')).toBe(3);
      expect(parser.evaluate('ceil(3.2)')).toBe(4);
    });

    it('should still allow string operations', () => {
      const parser = new Parser();

      expect(parser.evaluate('"hello" + " " + "world"')).toBe('hello world');
      expect(parser.evaluate('length "test"')).toBe(4);
    });

    it('should still allow conditional expressions', () => {
      const parser = new Parser();

      expect(parser.evaluate('x > 5 ? "big" : "small"', { x: 10 })).toBe('big');
      expect(parser.evaluate('x > 5 ? "big" : "small"', { x: 3 })).toBe('small');
    });

    it('should still allow logical operators', () => {
      const parser = new Parser();

      expect(parser.evaluate('true and false')).toBe(false);
      expect(parser.evaluate('true or false')).toBe(true);
      expect(parser.evaluate('not true')).toBe(false);
    });
  });

  describe('Assignment Operator Prototype Pollution Prevention', () => {
    it('should block __proto__ assignment', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('__proto__ = 1', {}))
        .toThrow(AccessError);
    });

    it('should block prototype assignment', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('prototype = 1', {}))
        .toThrow(AccessError);
    });

    it('should block constructor assignment', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('constructor = 1', {}))
        .toThrow();
    });

    it('should not pollute the variables object via assignment', () => {
      const parser = new Parser();
      const vars = { x: 0 } as any;

      expect(() => parser.evaluate('__proto__ = {isAdmin: true}', vars))
        .toThrow(AccessError);
      expect(({} as any).isAdmin).toBeUndefined();
    });

    it('should still allow normal variable assignment', () => {
      const parser = new Parser();

      expect(parser.evaluate('x = 5', { x: 0 })).toBe(5);
    });
  });

  describe('Bracket Notation Prototype Pollution Prevention', () => {
    it('should block obj["__proto__"] access', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('x["__proto__"]', { x: {} }))
        .toThrow(AccessError);
    });

    it('should block obj["prototype"] access', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('x["prototype"]', { x: { prototype: 1 } }))
        .toThrow(AccessError);
    });

    it('should block obj["constructor"] access', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('x["constructor"]', { x: {} }))
        .toThrow(AccessError);
    });

    it('should still allow normal bracket access with string keys', () => {
      const parser = new Parser();

      expect(parser.evaluate('x["name"]', { x: { name: 'test' } })).toBe('test');
    });

    it('should still allow normal bracket access with numeric indices', () => {
      const parser = new Parser();

      expect(parser.evaluate('arr[0]', { arr: [10, 20, 30] })).toBe(10);
      expect(parser.evaluate('arr[2]', { arr: [10, 20, 30] })).toBe(30);
    });
  });

  describe('Object Literal Property Key Validation', () => {
    it('should block __proto__ as object literal key', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('{__proto__: 1}'))
        .toThrow(AccessError);
    });

    it('should block prototype as object literal key', () => {
      const parser = new Parser();

      expect(() => parser.evaluate('{prototype: 1}'))
        .toThrow(AccessError);
    });

    it('should block constructor as object literal key', () => {
      const parser = new Parser();

      // 'constructor' is blocked at parse time since it shadows Object.prototype
      expect(() => parser.evaluate('{constructor: 1}'))
        .toThrow();
    });

    it('should still allow normal object literals', () => {
      const parser = new Parser();

      const result = parser.evaluate('{name: "test", value: 42}') as Record<string, unknown>;
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    });
  });

  describe('String Escape Parsing', () => {
    it('should correctly parse string ending with escaped backslash', () => {
      const parser = new Parser();

      const result = parser.evaluate('"hello\\\\"');
      expect(result).toBe('hello\\');
    });

    it('should correctly parse escaped quote after escaped backslash', () => {
      const parser = new Parser();

      const result = parser.evaluate('"hello\\\\\\"world"');
      expect(result).toBe('hello\\"world');
    });

    it('should correctly parse simple escaped quote', () => {
      const parser = new Parser();

      const result = parser.evaluate('"hello\\"world"');
      expect(result).toBe('hello"world');
    });

    it('should correctly parse multiple escaped backslashes', () => {
      const parser = new Parser();

      const result = parser.evaluate('"\\\\\\\\"');
      expect(result).toBe('\\\\');
    });

    it('should still parse normal strings correctly', () => {
      const parser = new Parser();

      expect(parser.evaluate('"hello"')).toBe('hello');
      expect(parser.evaluate("'world'")).toBe('world');
      expect(parser.evaluate('"hello\\nworld"')).toBe('hello\nworld');
    });
  });

  describe('Parser Recursion Depth Limits', () => {
    it('should reject deeply nested parentheses', () => {
      const parser = new Parser();
      const depth = 300;
      const expr = '('.repeat(depth) + '1' + ')'.repeat(depth);

      expect(() => parser.parse(expr)).toThrow(ParseError);
    });

    it('should reject deeply nested ternary expressions', () => {
      const parser = new Parser();
      let expr = '1';
      for (let i = 0; i < 260; i++) {
        expr = `x ? ${expr} : 0`;
      }

      expect(() => parser.parse(expr)).toThrow(ParseError);
    });

    it('should allow reasonably nested expressions', () => {
      const parser = new Parser();
      const expr = '((((1 + 2) * 3) - 4) / 5)';

      expect(parser.evaluate(expr)).toBe((((1 + 2) * 3) - 4) / 5);
    });

    it('should allow moderately nested ternaries', () => {
      const parser = new Parser();

      expect(parser.evaluate('x ? 1 : y ? 2 : 3', { x: false, y: true })).toBe(2);
    });
  });

});
