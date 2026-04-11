import { expect, describe, it } from 'vitest';
import { Parser } from '../../index.js';

// Comparison Operators Tests - Converted from operators.js
// Tests for ==, !=, >, >=, <, <= operators

const parser = new Parser();

describe('Comparison Operators TypeScript Test', () => {
  describe('== operator', () => {
    it('2 == 3', () => {
      expect(parser.evaluate('2 == 3')).toBe(false);
    });

    it('3 * 1 == 2', () => {
      expect(parser.evaluate('3 == 2')).toBe(false);
    });

    it('3 == 3', () => {
      expect(parser.evaluate('3 == 3')).toBe(true);
    });

    it('\'3\' == 3', () => {
      expect(parser.evaluate('\'3\' == 3')).toBe(false);
    });

    it('\'string 1\' == \'string 2\'', () => {
      expect(parser.evaluate('\'string 1\' == \'string 2\'')).toBe(false);
    });

    it('\'string 1\' == "string 1"', () => {
      expect(parser.evaluate('\'string 1\' == \'string 1\'')).toBe(true);
    });

    it('\'3\' == \'3\'', () => {
      expect(parser.evaluate('\'3\' == \'3\'')).toBe(true);
    });

    it('null == null (variables)', () => {
      expect(parser.evaluate('null == alsoNull', { null: null, alsoNull: null })).toBe(true);
    });
    it('null == null (single variable)', () => {
      expect(parser.evaluate('null == alsoNull', { alsoNull: null })).toBe(true);
    });
    it('null == null (no variables)', () => {
      expect(parser.evaluate('null == null')).toBe(true);
    });
    it('null cannot be overridden', () => {
      expect(parser.evaluate('null == alsoNull', { null: 100, alsoNull: null })).toBe(true);
    });
    it('null differs from 0', () => {
      expect(parser.evaluate('null == zero', { zero: 0 })).toBe(false);
    });
  });

  describe('!= operator', () => {
    it('2 != 3', () => {
      expect(parser.evaluate('2 != 3')).toBe(true);
    });

    it('3 != 2', () => {
      expect(parser.evaluate('3 != 2')).toBe(true);
    });

    it('3 != 3', () => {
      expect(parser.evaluate('3 != 3')).toBe(false);
    });

    it('\'3\' != 3', () => {
      expect(parser.evaluate('\'3\' != 3')).toBe(true);
    });

    it('\'3\' != \'3\'', () => {
      expect(parser.evaluate('\'3\' != \'3\'')).toBe(false);
    });

    it('\'string 1\' != \'string 1\'', () => {
      expect(parser.evaluate('\'string 1\' != \'string 1\'')).toBe(false);
    });

    it('\'string 1\' != \'string 2\'', () => {
      expect(parser.evaluate('\'string 1\' != \'string 2\'')).toBe(true);
    });
  });

  describe('> operator', () => {
    it('2 > 3', () => {
      expect(parser.evaluate('2 > 3')).toBe(false);
    });

    it('3 > 2', () => {
      expect(parser.evaluate('3 > 2')).toBe(true);
    });

    it('3 > 3', () => {
      expect(parser.evaluate('3 > 3')).toBe(false);
    });
  });

  describe('>= operator', () => {
    it('2 >= 3', () => {
      expect(parser.evaluate('2 >= 3')).toBe(false);
    });

    it('3 >= 2', () => {
      expect(parser.evaluate('3 >= 2')).toBe(true);
    });

    it('3 >= 3', () => {
      expect(parser.evaluate('3 >= 3')).toBe(true);
    });
  });

  describe('< operator', () => {
    it('2 < 3', () => {
      expect(parser.evaluate('2 < 3')).toBe(true);
    });

    it('3 < 2', () => {
      expect(parser.evaluate('3 < 2')).toBe(false);
    });

    it('3 < 3', () => {
      expect(parser.evaluate('3 < 3')).toBe(false);
    });
  });

  describe('<= operator', () => {
    it('2 <= 3', () => {
      expect(parser.evaluate('2 <= 3')).toBe(true);
    });

    it('3 <= 2', () => {
      expect(parser.evaluate('3 <= 2')).toBe(false);
    });

    it('3 <= 3', () => {
      expect(parser.evaluate('3 <= 3')).toBe(true);
    });
  });
});
