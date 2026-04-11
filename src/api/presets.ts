/**
 * Pre-composed parser configurations. Each preset is a plain object the caller
 * can spread into their own `defineParser({ ... })` call. Presets compose by
 * array concatenation — no inheritance, no builder pattern.
 *
 * ```ts
 * import { defineParser, coreParser, withMath, withString } from 'expr-eval';
 *
 * const parser = defineParser({
 *   operators: [...coreParser.operators, ...withMath.operators, ...withString.operators],
 *   functions: [...coreParser.functions, ...withMath.functions, ...withString.functions]
 * });
 * ```
 */
import type { OperatorDescriptor } from '../registry/operator-descriptor.js';
import type { FunctionDescriptor } from '../registry/function-descriptor.js';
import { CORE_OPERATORS, CORE_FUNCTIONS } from '../registry/presets/core.js';
import { COMPARISON_OPERATORS } from '../registry/presets/comparison.js';
import { LOGICAL_OPERATORS } from '../registry/presets/logical.js';
import { MATH_OPERATORS, MATH_FUNCTIONS } from '../registry/presets/math.js';
import { STRING_OPERATORS, STRING_FUNCTIONS } from '../registry/presets/string.js';
import { ARRAY_FUNCTIONS } from '../registry/presets/array.js';
import { OBJECT_FUNCTIONS } from '../registry/presets/object.js';
import { TYPE_CHECK_FUNCTIONS } from '../registry/presets/type-check.js';
import { UTILITY_OPERATORS, UTILITY_FUNCTIONS } from '../registry/presets/utility.js';

/**
 * Shape of every preset: a bundle of operator and function descriptors the
 * caller spreads into a `ParserConfig`.
 */
export interface ParserPreset {
  readonly operators: readonly OperatorDescriptor[];
  readonly functions: readonly FunctionDescriptor[];
}

/**
 * Minimal preset: arithmetic, assignment, member access, ternary, unary
 * `+`/`-`/`!`, and the `??` coalesce operator. Includes no functions — the
 * caller picks which category to pull in next.
 */
export const coreParser: ParserPreset = {
  operators: CORE_OPERATORS,
  functions: CORE_FUNCTIONS
};

/** Equality and relational operators, plus `in` / `not in`. */
export const withComparison: ParserPreset = {
  operators: COMPARISON_OPERATORS,
  functions: []
};

/** `and` / `or` / `not` and their symbolic aliases. */
export const withLogical: ParserPreset = {
  operators: LOGICAL_OPERATORS,
  functions: []
};

/** Math functions (max, min, hypot, …) and every trig/log/root unary prefix. */
export const withMath: ParserPreset = {
  operators: MATH_OPERATORS,
  functions: MATH_FUNCTIONS
};

/** String manipulation functions and the `length` prefix. */
export const withString: ParserPreset = {
  operators: STRING_OPERATORS,
  functions: STRING_FUNCTIONS
};

/** Array / collection functions (`map`, `fold`, `filter`, …). */
export const withArray: ParserPreset = {
  operators: [],
  functions: ARRAY_FUNCTIONS
};

/** Object manipulation (`merge`, `keys`, `values`, `flatten`). */
export const withObject: ParserPreset = {
  operators: [],
  functions: OBJECT_FUNCTIONS
};

/** Runtime type-checking predicates (`isArray`, `isNumber`, …). */
export const withTypeCheck: ParserPreset = {
  operators: [],
  functions: TYPE_CHECK_FUNCTIONS
};

/** `if`, `json`, and the `as` cast operator. */
export const withUtility: ParserPreset = {
  operators: UTILITY_OPERATORS,
  functions: UTILITY_FUNCTIONS
};

/**
 * Everything expr-eval ships with — the v6 default. Equivalent to the legacy
 * zero-argument `new Parser()` surface area.
 */
export const fullParser: ParserPreset = {
  operators: [
    ...CORE_OPERATORS,
    ...COMPARISON_OPERATORS,
    ...LOGICAL_OPERATORS,
    ...MATH_OPERATORS,
    ...STRING_OPERATORS,
    ...UTILITY_OPERATORS
  ],
  functions: [
    ...CORE_FUNCTIONS,
    ...MATH_FUNCTIONS,
    ...STRING_FUNCTIONS,
    ...ARRAY_FUNCTIONS,
    ...OBJECT_FUNCTIONS,
    ...TYPE_CHECK_FUNCTIONS,
    ...UTILITY_FUNCTIONS
  ]
};
