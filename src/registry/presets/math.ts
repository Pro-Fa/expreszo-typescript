/**
 * Math preset — math functions and every trig/log/root unary prefix.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import type { FunctionDescriptor } from '../function-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';
import {
  abs, acos, acosh, asin, asinh, atan, atanh, cbrt, ceil, cos, cosh,
  exp, expm1, floor, log, log10, log1p, log2, round, sign, sin, sinh,
  sqrt, tan, tanh, trunc
} from '../../operators/unary/index.js';

export const MATH_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: 'abs',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'abs',   pure: true, impl: abs },
  { symbol: 'acos',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'acos',  pure: true, impl: acos },
  { symbol: 'acosh', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'acosh', pure: true, impl: acosh },
  { symbol: 'asin',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'asin',  pure: true, impl: asin },
  { symbol: 'asinh', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'asinh', pure: true, impl: asinh },
  { symbol: 'atan',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'atan',  pure: true, impl: atan },
  { symbol: 'atanh', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'atanh', pure: true, impl: atanh },
  { symbol: 'cbrt',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'cbrt',  pure: true, impl: cbrt },
  { symbol: 'ceil',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'ceil',  pure: true, impl: ceil },
  { symbol: 'cos',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'cos',   pure: true, impl: cos },
  { symbol: 'cosh',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'cosh',  pure: true, impl: cosh },
  { symbol: 'exp',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'exp',   pure: true, impl: exp },
  { symbol: 'expm1', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'expm1', pure: true, impl: expm1 },
  { symbol: 'floor', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'floor', pure: true, impl: floor },
  { symbol: 'lg',    kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'lg',    pure: true, impl: log10 },
  { symbol: 'ln',    kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'ln',    pure: true, impl: log },
  { symbol: 'log',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'log',   pure: true, impl: log },
  { symbol: 'log1p', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'log1p', pure: true, impl: log1p },
  { symbol: 'log2',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'log2',  pure: true, impl: log2 },
  { symbol: 'log10', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'log10', pure: true, impl: log10 },
  { symbol: 'round', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'round', pure: true, impl: round },
  { symbol: 'sign',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'sign',  pure: true, impl: sign },
  { symbol: 'sin',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'sin',   pure: true, impl: sin },
  { symbol: 'sinh',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'sinh',  pure: true, impl: sinh },
  { symbol: 'sqrt',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'sqrt',  pure: true, impl: sqrt },
  { symbol: 'tan',   kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'tan',   pure: true, impl: tan },
  { symbol: 'tanh',  kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'tanh',  pure: true, impl: tanh },
  { symbol: 'trunc', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'trunc', pure: true, impl: trunc }
];

export const MATH_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'math'
);
