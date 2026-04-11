/**
 * `expr-eval/math` entry — math functions and unary prefixes.
 * Pair with `expr-eval/core` to get a parser that handles `sqrt`, `max`, etc.
 */
export { withMath } from '../api/presets.js';
export { MATH_OPERATORS, MATH_FUNCTIONS } from '../registry/presets/math.js';
