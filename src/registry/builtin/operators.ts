/**
 * Built-in operator catalog. Mirrors the hand-rolled registrations in
 * `src/parsing/parser.ts` (unaryOps / binaryOps / ternaryOps) and the
 * precedence cascade in `src/parsing/parser-state.ts`. Phase 2 introduces
 * this as a typed parallel source-of-truth; Phase 2.4 will flip the Pratt
 * parser to read from it, and Phase 4 will delete the hand-rolled records.
 *
 * Every `impl` here is the *same function reference* the legacy parser
 * registers — a catalog-parity test asserts this at build time so the two
 * sources cannot drift.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import {
  add, sub, mul, div, mod, pow, concat,
  equal, notEqual, greaterThan, lessThan, greaterThanEqual, lessThanEqual,
  setVar, arrayIndexOrProperty,
  andOperator, orOperator,
  inOperator, notInOperator,
  coalesce, asOperator
} from '../../operators/binary/index.js';
import {
  pos, abs, acos, sinh, tanh, asin, asinh, acosh, atan, atanh,
  cbrt, ceil, cos, cosh, exp, floor, log, log10, neg, not, round,
  sin, sqrt, tan, trunc, length, sign, expm1, log1p, log2
} from '../../operators/unary/index.js';
import { fac, condition } from '../../functions/index.js';

/**
 * Binary / infix operators in loosest-to-tightest order. Associativity and
 * precedence mirror the 14-method recursive-descent cascade in
 * `parser-state.ts`. `=` is marked `pure: false` because assignment mutates
 * the values scope and cannot be constant-folded by the simplify visitor.
 */
export const BINARY_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: '=',      kind: 'infix', arity: 2, precedence: Precedence.Assignment, associativity: 'right', optionName: 'assignment',  pure: false, impl: setVar },

  { symbol: 'or',     kind: 'infix', arity: 2, precedence: Precedence.Or,         associativity: 'left',  optionName: 'logical',     pure: true,  impl: orOperator },
  { symbol: '||',     kind: 'infix', arity: 2, precedence: Precedence.Or,         associativity: 'left',  optionName: 'logical',     pure: true,  impl: orOperator },

  { symbol: 'and',    kind: 'infix', arity: 2, precedence: Precedence.And,        associativity: 'left',  optionName: 'logical',     pure: true,  impl: andOperator },
  { symbol: '&&',     kind: 'infix', arity: 2, precedence: Precedence.And,        associativity: 'left',  optionName: 'logical',     pure: true,  impl: andOperator },

  { symbol: '==',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: equal },
  { symbol: '!=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: notEqual },
  { symbol: '<',      kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: lessThan },
  { symbol: '<=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: lessThanEqual },
  { symbol: '>',      kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: greaterThan },
  { symbol: '>=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'comparison',  pure: true,  impl: greaterThanEqual },
  { symbol: 'in',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'in',          pure: true,  impl: inOperator },
  { symbol: 'not in', kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left',  optionName: 'in',          pure: true,  impl: notInOperator },

  { symbol: '+',      kind: 'infix', arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'add',         pure: true,  impl: add },
  { symbol: '-',      kind: 'infix', arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'subtract',    pure: true,  impl: sub },
  { symbol: '|',      kind: 'infix', arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'concatenate', pure: true,  impl: concat },

  { symbol: '*',      kind: 'infix', arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'multiply',    pure: true,  impl: mul },
  { symbol: '/',      kind: 'infix', arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'divide',      pure: true,  impl: div },
  { symbol: '%',      kind: 'infix', arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'remainder',   pure: true,  impl: mod },

  { symbol: '??',     kind: 'infix', arity: 2, precedence: Precedence.Coalesce,   associativity: 'left',  optionName: 'coalesce',    pure: true,  impl: coalesce },
  { symbol: 'as',     kind: 'infix', arity: 2, precedence: Precedence.Coalesce,   associativity: 'left',  optionName: 'conversion',  pure: true,  impl: asOperator },

  { symbol: '^',      kind: 'infix', arity: 2, precedence: Precedence.Exponent,   associativity: 'right', optionName: 'power',       pure: true,  impl: pow },

  { symbol: '[',      kind: 'infix', arity: 2, precedence: Precedence.Member,     associativity: 'left',  optionName: 'array',       pure: true,  impl: arrayIndexOrProperty }
];

/**
 * Unary operators. `-` `+` `not` `!` are syntactic; everything else is also
 * valid as a call-style function (`sin(x)` and `sin x` both parse). Postfix
 * `!` is a factorial — implementation shared with the `fac` function.
 */
export const UNARY_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: '-',      kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'subtract',  pure: true, impl: neg },
  { symbol: '+',      kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'add',       pure: true, impl: pos },
  { symbol: 'not',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'logical',   pure: true, impl: not },

  { symbol: '!',      kind: 'postfix', arity: 1, precedence: Precedence.Postfix, associativity: 'left',  optionName: 'factorial', pure: true, impl: fac },

  { symbol: 'abs',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'abs',    pure: true, impl: abs },
  { symbol: 'acos',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'acos',   pure: true, impl: acos },
  { symbol: 'acosh',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'acosh',  pure: true, impl: acosh },
  { symbol: 'asin',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'asin',   pure: true, impl: asin },
  { symbol: 'asinh',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'asinh',  pure: true, impl: asinh },
  { symbol: 'atan',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'atan',   pure: true, impl: atan },
  { symbol: 'atanh',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'atanh',  pure: true, impl: atanh },
  { symbol: 'cbrt',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'cbrt',   pure: true, impl: cbrt },
  { symbol: 'ceil',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'ceil',   pure: true, impl: ceil },
  { symbol: 'cos',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'cos',    pure: true, impl: cos },
  { symbol: 'cosh',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'cosh',   pure: true, impl: cosh },
  { symbol: 'exp',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'exp',    pure: true, impl: exp },
  { symbol: 'expm1',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'expm1',  pure: true, impl: expm1 },
  { symbol: 'floor',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'floor',  pure: true, impl: floor },
  { symbol: 'length', kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'length', pure: true, impl: length },
  { symbol: 'lg',     kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'lg',     pure: true, impl: log10 },
  { symbol: 'ln',     kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'ln',     pure: true, impl: log },
  { symbol: 'log',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'log',    pure: true, impl: log },
  { symbol: 'log1p',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'log1p',  pure: true, impl: log1p },
  { symbol: 'log2',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'log2',   pure: true, impl: log2 },
  { symbol: 'log10',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'log10',  pure: true, impl: log10 },
  { symbol: 'round',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'round',  pure: true, impl: round },
  { symbol: 'sign',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'sign',   pure: true, impl: sign },
  { symbol: 'sin',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'sin',    pure: true, impl: sin },
  { symbol: 'sinh',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'sinh',   pure: true, impl: sinh },
  { symbol: 'sqrt',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'sqrt',   pure: true, impl: sqrt },
  { symbol: 'tan',    kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'tan',    pure: true, impl: tan },
  { symbol: 'tanh',   kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'tanh',   pure: true, impl: tanh },
  { symbol: 'trunc',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,  associativity: 'right', optionName: 'trunc',  pure: true, impl: trunc }
];

/**
 * Ternary operators. Currently just `?:` which the Pratt rewrite will handle
 * as a mixfix rule — descriptors model it as `kind: 'ternary'` for catalog
 * consumers today.
 */
export const TERNARY_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: '?', kind: 'ternary', arity: 3, precedence: Precedence.Ternary, associativity: 'right', optionName: 'conditional', pure: true, impl: condition }
];

export const ALL_OPERATORS: readonly OperatorDescriptor[] = [
  ...BINARY_OPERATORS,
  ...UNARY_OPERATORS,
  ...TERNARY_OPERATORS
];
