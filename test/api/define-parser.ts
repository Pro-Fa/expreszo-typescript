import { describe, it, expect } from 'vitest';
import {
  defineParser,
  coreParser,
  withComparison,
  withLogical,
  withMath,
  withString,
  withArray,
  withObject,
  withUtility,
  fullParser,
  Parser
} from '../../index.js';

/**
 * `defineParser` smoke tests. Verifies the factory wires descriptor arrays
 * into a working `Parser` and that individual presets load in isolation.
 * Full behavioral coverage lives in the existing Parser test suites — the
 * new factory is a thin shim so we only assert that composition works.
 */
describe('defineParser', () => {
  it('returns a usable Parser from the core preset alone', () => {
    const parser = defineParser({
      operators: coreParser.operators,
      functions: coreParser.functions
    });

    expect(parser).toBeInstanceOf(Parser);
    expect(parser.evaluate('1 + 2 * 3')).toBe(7);
    expect(parser.evaluate('(1 + 2) * 3')).toBe(9);
    expect(parser.evaluate('10 % 3')).toBe(1);
    expect(parser.evaluate('2 ^ 10')).toBe(1024);
  });

  it('wires comparison operators from withComparison', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators],
      functions: coreParser.functions
    });

    expect(parser.evaluate('1 < 2')).toBe(true);
    expect(parser.evaluate('1 == 1')).toBe(true);
    expect(parser.evaluate('3 != 4')).toBe(true);
  });

  it('wires logical operators from withLogical', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators, ...withLogical.operators],
      functions: coreParser.functions
    });

    expect(parser.evaluate('true and false')).toBe(false);
    expect(parser.evaluate('true or false')).toBe(true);
    expect(parser.evaluate('not true')).toBe(false);
  });

  it('wires math functions and unary prefixes from withMath', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withMath.operators],
      functions: [...coreParser.functions, ...withMath.functions]
    });

    expect(parser.evaluate('sqrt(16)')).toBe(4);
    expect(parser.evaluate('max(1, 2, 3)')).toBe(3);
    expect(parser.evaluate('min(5, 2, 8)')).toBe(2);
    expect(parser.evaluate('abs(-7)')).toBe(7);
  });

  it('wires string functions from withString', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withString.operators],
      functions: [...coreParser.functions, ...withString.functions]
    });

    expect(parser.evaluate('toUpper("hello")')).toBe('HELLO');
    expect(parser.evaluate('length("abc")')).toBe(3);
  });

  it('wires array functions from withArray', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators, ...withArray.operators],
      functions: [...coreParser.functions, ...withArray.functions]
    });

    expect(parser.evaluate('count([1, 2, 3])')).toBe(3);
    expect(parser.evaluate('unique([1, 2, 2, 3, 1])')).toEqual([1, 2, 3]);
  });

  it('wires object functions from withObject', () => {
    const parser = defineParser({
      operators: coreParser.operators,
      functions: [...coreParser.functions, ...withObject.functions]
    });

    expect(parser.evaluate('keys({a: 1, b: 2})')).toEqual(['a', 'b']);
  });

  it('wires the as cast operator and if() from withUtility', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators, ...withUtility.operators],
      functions: [...coreParser.functions, ...withUtility.functions]
    });

    expect(parser.evaluate('if(1 < 2, "yes", "no")')).toBe('yes');
    expect(parser.evaluate('"42" as "number"')).toBe(42);
  });

  it('fullParser evaluates a full mix of built-ins like a default Parser', () => {
    const legacy = new Parser();
    const v7 = defineParser({
      operators: fullParser.operators,
      functions: fullParser.functions
    });

    const samples = [
      '2 + 3 * 4',
      'sqrt(9) + 1',
      'max(1, 2, 3)',
      'toUpper("abc")',
      'if(1 < 2, 10, 20)',
      '[1, 2, 3] | [4, 5]'
    ];

    for (const expr of samples) {
      expect(v7.evaluate(expr)).toEqual(legacy.evaluate(expr));
    }
  });

  it('passes through allowMemberAccess option', () => {
    const parser = defineParser({
      operators: fullParser.operators,
      functions: fullParser.functions,
      options: { allowMemberAccess: false }
    });

    expect(() => parser.evaluate('x.y', { x: { y: 1 } })).toThrow();
  });

  it('passes through operators gate option', () => {
    const parser = defineParser({
      operators: fullParser.operators,
      functions: fullParser.functions,
      options: { operators: { add: false } }
    });

    expect(() => parser.parse('1 + 2')).toThrow();
  });
});
