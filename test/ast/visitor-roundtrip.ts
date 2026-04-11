import { describe, it, expect } from 'vitest';
import { Parser, Expression } from '../../index.js';
import { fromInstructions } from '../../src/ast/from-instructions.js';
import { nodeToString } from '../../src/ast/visitors/to-string.js';
import { getSymbolsFromNode } from '../../src/ast/visitors/get-symbols.js';
import { simplifyAst } from '../../src/ast/visitors/simplify.js';
import { substituteAst } from '../../src/ast/visitors/substitute.js';

/**
 * Phase 1 parity harness: for every interesting expression the project's
 * existing test corpus uses, parse with the legacy parser, bridge to AST,
 * run the new visitor, and assert the result matches the legacy RPN-based
 * implementation byte-for-byte.
 *
 * Deleted in Phase 2 once the parser emits AST directly and the visitors
 * become the only implementation.
 */

const parser = new Parser();

const PARSE_CASES: readonly string[] = [
  // Literals and primitives
  '1', '-1', '0.5', '"hello"', 'true', 'false', 'null',
  '[1, 2, 3]', '[]',
  '{ a: 1, b: 2 }', '{}',
  // Unary
  '-x', '+x', 'not x', 'x!',
  // Binary arithmetic
  '1 + 2', 'x + 1', '1 + x', 'x + y',
  '2 * 3 + 4', '2 + 3 * 4', '(2 + 3) * 4',
  '2 ^ 3', 'a - b - c', '10 / 2 / 5',
  '5 % 3',
  // Comparison and logical
  'a == b', 'a != b', 'a < b', 'a >= b',
  'a and b', 'a or b', 'not a and b',
  'a and b or c', 'a or b and c',
  'not 0 or 1 and 2',
  // Ternary
  'a ? b : c',
  'a ? b : c ? d : e',
  // Member / index / call
  'sin(x)', 'max(1, 2, 3)', 'obj.prop', 'obj.a.b',
  'obj.method(x)', 'sin(obj.x)',
  'arr[0]', 'arr[i + 1]',
  // Assignment and sequences
  'x = 1 + 2',
  'x = x + 1',
  '3 ; 2 ; 1', '3 ; 2 ; 1 ;',
  'a; b; c',
  // Arrow / lambda
  'x => x + 1',
  '(a, b) => a + b',
  // Case/when
  'case when 1 == 1 then "a" else "b" end',
  'case x when 1 then "a" when 2 then "b" else "c" end',
  // Concat
  'a | b',
  // Object access
  '{ a: 1 }.a'
];

const SIMPLIFY_CASES: readonly { expr: string; values?: Record<string, number> }[] = [
  { expr: '2 + 3' },
  { expr: 'x + (2 + 3)' },
  { expr: '(2 + 3) + x' },
  { expr: 'x + 2 + 3' },
  { expr: '2 + x + 3' },
  { expr: 'x + y' },
  { expr: 'sin(2 * pi)', values: { pi: Math.PI } },
  { expr: '2 * x', values: { x: 5 } },
  { expr: 'x * y + z', values: { y: 2 } }
];

const SUBSTITUTE_CASES: readonly { expr: string; variable: string; replacement: string }[] = [
  { expr: 'x + y', variable: 'x', replacement: '2 * z' },
  { expr: 'x * (y * 2)', variable: 'x', replacement: '3' },
  { expr: 'x * (y * 2)', variable: 'y', replacement: '4' },
  { expr: 'a + b * c', variable: 'b', replacement: '5' },
  { expr: 'sin(x) + x', variable: 'x', replacement: 'y + 1' }
];

const SYMBOL_CASES: readonly string[] = [
  'x + y',
  'sin(x) + cos(y)',
  'x + y + x',
  'obj.a + obj.b',
  'obj.a.b + obj.c',
  'f(g(x), h(y))',
  'a ? b : c',
  'x = y + z',
  '3; 2; 1',
  'case x when 1 then a else b end',
  '(a, b) => a + b',
  // Quirky legacy prevVar-flush ordering that Phase 1 must preserve:
  'x.y ? x.y.z : default.z',
  'x.y < 3 ? 2 * x.y.z : default.z + 1',
  'x + x.y + x.z',
  'max(conf.limits.lower, conf.limits.upper)',
  'fn.max(conf.limits.lower, conf.limits.upper)',
  'user.age + 2',
  'x'
];

function astOf(expr: Expression) {
  return fromInstructions(expr.tokens);
}

describe('AST visitor parity with legacy RPN implementations', () => {
  describe('toString visitor', () => {
    it.each(PARSE_CASES)('matches legacy for %s', (source) => {
      const expr = parser.parse(source);
      const legacy = expr.toString();
      const viaAst = nodeToString(astOf(expr));
      expect(viaAst).toBe(legacy);
    });
  });

  describe('symbols visitor', () => {
    it.each(SYMBOL_CASES)('matches legacy for %s', (source) => {
      const expr = parser.parse(source);
      const legacySymbols = expr.symbols();
      const legacySymbolsWithMembers = expr.symbols({ withMembers: true });

      const plain: string[] = [];
      getSymbolsFromNode(astOf(expr), plain);
      const members: string[] = [];
      getSymbolsFromNode(astOf(expr), members, { withMembers: true });

      expect(plain).toEqual(legacySymbols);
      expect(members).toEqual(legacySymbolsWithMembers);
    });
  });

  describe('simplify visitor', () => {
    it.each(SIMPLIFY_CASES)('matches legacy for $expr', ({ expr, values }) => {
      const parsed = parser.parse(expr);
      const legacySimplified = parsed.simplify(values).toString();

      const simplifiedNode = simplifyAst(astOf(parsed), {
        unaryOps: parser.unaryOps,
        binaryOps: parser.binaryOps,
        ternaryOps: parser.ternaryOps,
        values: values || {}
      });
      const viaAst = nodeToString(simplifiedNode);
      expect(viaAst).toBe(legacySimplified);
    });
  });

  describe('substitute visitor', () => {
    it.each(SUBSTITUTE_CASES)('matches legacy for $expr / $variable', ({ expr, variable, replacement }) => {
      const parsed = parser.parse(expr);
      const replParsed = parser.parse(replacement);
      const legacySubstituted = parsed.substitute(variable, replParsed).toString();

      const substitutedNode = substituteAst(astOf(parsed), variable, astOf(replParsed));
      const viaAst = nodeToString(substitutedNode);
      expect(viaAst).toBe(legacySubstituted);
    });
  });
});
