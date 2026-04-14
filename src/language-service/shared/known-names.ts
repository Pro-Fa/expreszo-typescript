import type { Parser } from '../../parsing/parser.js';
import type { Values } from '../../types/values.js';

/**
 * Collect every identifier name the parser recognizes as "declared":
 * built-in functions, unary operators, numeric constants, literal
 * keywords, language keywords, and user-supplied variables.
 */
export function buildKnownNames(parser: Parser, variables: Values | undefined): Set<string> {
  const known = new Set<string>();
  if (parser.functions) for (const k of Object.keys(parser.functions)) known.add(k);
  if (parser.unaryOps) for (const k of Object.keys(parser.unaryOps)) known.add(k);
  if (parser.numericConstants) for (const k of Object.keys(parser.numericConstants)) known.add(k);
  if (parser.buildInLiterals) for (const k of Object.keys(parser.buildInLiterals)) known.add(k);
  if (parser.keywords) for (const k of parser.keywords) known.add(k);
  if (variables) for (const k of Object.keys(variables)) known.add(k);
  return known;
}
