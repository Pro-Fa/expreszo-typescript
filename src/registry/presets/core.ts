/**
 * Core preset — the minimum surface every parser needs: arithmetic,
 * assignment, the ternary operator, and member/index access. No math
 * unary prefixes (sin, cos, sqrt) — those live in the `math` preset.
 * No logical/comparison operators — those live in the `logical` and
 * `comparison` presets so a caller can opt out cleanly.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import type { FunctionDescriptor } from '../function-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import {
  add, sub, mul, div, mod, pow, concat,
  setVar, arrayIndexOrProperty, coalesce
} from '../../operators/binary/index.js';
import { neg, pos } from '../../operators/unary/index.js';
import { fac, condition } from '../../functions/index.js';

export const CORE_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: '=',  kind: 'infix',   arity: 2, precedence: Precedence.Assignment, associativity: 'right', optionName: 'assignment',  pure: false, impl: setVar },
  { symbol: '+',  kind: 'infix',   arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'add',         pure: true,  impl: add },
  { symbol: '-',  kind: 'infix',   arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'subtract',    pure: true,  impl: sub },
  { symbol: '|',  kind: 'infix',   arity: 2, precedence: Precedence.AddSub,     associativity: 'left',  optionName: 'concatenate', pure: true,  impl: concat },
  { symbol: '*',  kind: 'infix',   arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'multiply',    pure: true,  impl: mul },
  { symbol: '/',  kind: 'infix',   arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'divide',      pure: true,  impl: div },
  { symbol: '%',  kind: 'infix',   arity: 2, precedence: Precedence.MulDiv,     associativity: 'left',  optionName: 'remainder',   pure: true,  impl: mod },
  { symbol: '??', kind: 'infix',   arity: 2, precedence: Precedence.Coalesce,   associativity: 'left',  optionName: 'coalesce',    pure: true,  impl: coalesce },
  { symbol: '^',  kind: 'infix',   arity: 2, precedence: Precedence.Exponent,   associativity: 'right', optionName: 'power',       pure: true,  impl: pow },
  { symbol: '[',  kind: 'infix',   arity: 2, precedence: Precedence.Member,     associativity: 'left',  optionName: 'array',       pure: true,  impl: arrayIndexOrProperty },

  { symbol: '-',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,     associativity: 'right', optionName: 'subtract',    pure: true,  impl: neg },
  { symbol: '+',  kind: 'prefix',  arity: 1, precedence: Precedence.Prefix,     associativity: 'right', optionName: 'add',         pure: true,  impl: pos },
  { symbol: '!',  kind: 'postfix', arity: 1, precedence: Precedence.Postfix,    associativity: 'left',  optionName: 'factorial',   pure: true,  impl: fac },

  { symbol: '?',  kind: 'ternary', arity: 3, precedence: Precedence.Ternary,    associativity: 'right', optionName: 'conditional', pure: true,  impl: condition }
];

export const CORE_FUNCTIONS: readonly FunctionDescriptor[] = [];
