import { describe, it, expect } from 'vitest';
import { defineParser, coreParser } from '../../src/entries/core.js';
import { withMath, MATH_FUNCTIONS } from '../../src/entries/math.js';
import { withString } from '../../src/entries/string.js';
import { withArray } from '../../src/entries/array.js';
import { withObject } from '../../src/entries/object.js';
import { withComparison } from '../../src/entries/comparison.js';
import { withLogical } from '../../src/entries/logical.js';
import { withTypeCheck } from '../../src/entries/type-check.js';
import { withUtility } from '../../src/entries/utility.js';

/**
 * Subpath entries must be importable in isolation so a consumer can do
 * `import { withMath } from '@pro-fa/expreszo/math'` and get only the math preset.
 * This test imports each shim and exercises it with `defineParser` built
 * from the core shim alone.
 */
describe('subpath entries compose with defineParser', () => {
  it('core alone evaluates basic arithmetic', () => {
    const parser = defineParser({
      operators: coreParser.operators,
      functions: coreParser.functions
    });
    expect(parser.evaluate('1 + 2 * 3')).toBe(7);
  });

  it('core + math enables sqrt/max', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withMath.operators],
      functions: [...coreParser.functions, ...withMath.functions]
    });
    expect(parser.evaluate('sqrt(16) + max(1, 2, 3)')).toBe(7);
    expect(MATH_FUNCTIONS.length).toBeGreaterThan(0);
  });

  it('core + string enables toUpper/length', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withString.operators],
      functions: [...coreParser.functions, ...withString.functions]
    });
    expect(parser.evaluate('toUpper("hi")')).toBe('HI');
    expect(parser.evaluate('length("abc")')).toBe(3);
  });

  it('core + array enables count/unique', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators, ...withArray.operators],
      functions: [...coreParser.functions, ...withArray.functions]
    });
    expect(parser.evaluate('count([1, 2, 3])')).toBe(3);
  });

  it('core + object enables keys', () => {
    const parser = defineParser({
      operators: coreParser.operators,
      functions: [...coreParser.functions, ...withObject.functions]
    });
    expect(parser.evaluate('keys({a: 1, b: 2})')).toEqual(['a', 'b']);
  });

  it('core + logical enables and/or/not', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withLogical.operators],
      functions: coreParser.functions
    });
    expect(parser.evaluate('true and false')).toBe(false);
    expect(parser.evaluate('not true')).toBe(false);
  });

  it('core + comparison enables equality/relational ops', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators],
      functions: coreParser.functions
    });
    expect(parser.evaluate('1 < 2')).toBe(true);
  });

  it('core + type-check enables isArray/isNumber', () => {
    const parser = defineParser({
      operators: coreParser.operators,
      functions: [...coreParser.functions, ...withTypeCheck.functions]
    });
    expect(parser.evaluate('isNumber(42)')).toBe(true);
    expect(parser.evaluate('isArray([1,2,3])')).toBe(true);
  });

  it('core + utility enables if() and the as cast', () => {
    const parser = defineParser({
      operators: [...coreParser.operators, ...withComparison.operators, ...withUtility.operators],
      functions: [...coreParser.functions, ...withUtility.functions]
    });
    expect(parser.evaluate('if(1 < 2, "a", "b")')).toBe('a');
    expect(parser.evaluate('"42" as "number"')).toBe(42);
  });
});
