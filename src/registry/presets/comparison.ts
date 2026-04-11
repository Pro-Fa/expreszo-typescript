/**
 * Comparison preset — equality and relational operators, plus `in` / `not in`.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import {
  equal, notEqual, greaterThan, lessThan, greaterThanEqual, lessThanEqual,
  inOperator, notInOperator
} from '../../operators/binary/index.js';

export const COMPARISON_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: '==',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: equal },
  { symbol: '!=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: notEqual },
  { symbol: '<',      kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: lessThan },
  { symbol: '<=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: lessThanEqual },
  { symbol: '>',      kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: greaterThan },
  { symbol: '>=',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'comparison', pure: true, impl: greaterThanEqual },
  { symbol: 'in',     kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'in',         pure: true, impl: inOperator },
  { symbol: 'not in', kind: 'infix', arity: 2, precedence: Precedence.Comparison, associativity: 'left', optionName: 'in',         pure: true, impl: notInOperator }
];
