import { describe, it, expect } from 'vitest';
import { Parser } from '../../index.js';
import {
  BINARY_OPERATORS,
  UNARY_OPERATORS,
  TERNARY_OPERATORS,
  BUILTIN_FUNCTIONS
} from '../../src/registry/index.js';

/**
 * Catalog-parity test: the descriptor arrays in `src/registry/builtin/*` are
 * the Phase 2 source-of-truth that Phase 2.4 will hand to the Pratt parser
 * and Phase 4 will hand to the validator / language-service. Until those
 * migrations land, the legacy hand-rolled records in `Parser` must match the
 * descriptor catalog symbol-for-symbol and reference-for-reference — if they
 * drift, later phases silently lose ops or functions.
 */
describe('descriptor catalog parity with legacy Parser records', () => {
  const parser = new Parser();

  it('every binary/ternary operator descriptor maps to the same impl Parser registered', () => {
    for (const op of BINARY_OPERATORS) {
      expect(parser.binaryOps[op.symbol], `binary op ${op.symbol}`).toBe(op.impl);
    }
    for (const op of TERNARY_OPERATORS) {
      expect(parser.ternaryOps[op.symbol], `ternary op ${op.symbol}`).toBe(op.impl);
    }
  });

  it('every unary operator descriptor maps to the same impl Parser registered', () => {
    for (const op of UNARY_OPERATORS) {
      if (op.kind === 'postfix' && op.symbol === '!') {
        // Postfix `!` delegates to the `fac` unary slot on the legacy parser.
        expect(parser.unaryOps['!'], 'postfix !').toBe(op.impl);
        continue;
      }
      expect(parser.unaryOps[op.symbol], `unary op ${op.symbol}`).toBe(op.impl);
    }
  });

  it('descriptor binary-op set is a superset of Parser.binaryOps (allowing duplicate symbols like and / &&)', () => {
    const descriptorSymbols = new Set(BINARY_OPERATORS.map(op => op.symbol));
    for (const symbol of Object.keys(parser.binaryOps)) {
      expect(descriptorSymbols.has(symbol), `Parser.binaryOps has ${symbol} but descriptor catalog does not`).toBe(true);
    }
  });

  it('descriptor unary-op set matches Parser.unaryOps symbol-for-symbol', () => {
    const prefixSymbols = new Set(
      UNARY_OPERATORS.filter(op => op.kind === 'prefix').map(op => op.symbol)
    );
    // postfix `!` is in Parser.unaryOps under the same key
    prefixSymbols.add('!');
    expect(prefixSymbols).toEqual(new Set(Object.keys(parser.unaryOps)));
  });

  it('descriptor ternary-op set matches Parser.ternaryOps', () => {
    const descriptorSymbols = new Set(TERNARY_OPERATORS.map(op => op.symbol));
    expect(descriptorSymbols).toEqual(new Set(Object.keys(parser.ternaryOps)));
  });

  it('every function descriptor maps to the same impl Parser.functions registered', () => {
    for (const fn of BUILTIN_FUNCTIONS) {
      expect(parser.functions[fn.name], `function ${fn.name}`).toBe(fn.impl);
    }
  });

  it('function descriptor set matches Parser.functions symbol-for-symbol', () => {
    const descriptorNames = new Set(BUILTIN_FUNCTIONS.map(fn => fn.name));
    expect(descriptorNames).toEqual(new Set(Object.keys(parser.functions)));
  });

  it('only random() is marked impure', () => {
    const impure = BUILTIN_FUNCTIONS.filter(fn => !fn.pure).map(fn => fn.name);
    expect(impure).toEqual(['random']);
  });

  it('only assignment is marked impure among operators', () => {
    const impure = BINARY_OPERATORS.filter(op => !op.pure).map(op => op.symbol);
    expect(impure).toEqual(['=']);
  });
});
