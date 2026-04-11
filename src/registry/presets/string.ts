/**
 * String preset — string category functions plus the `length` unary prefix
 * (which also doubles as a call).
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import type { FunctionDescriptor } from '../function-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';
import { length } from '../../operators/unary/index.js';

export const STRING_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: 'length', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'length', pure: true, impl: length }
];

export const STRING_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'string'
);
