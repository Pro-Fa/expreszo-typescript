/**
 * Utility preset — `if`, `json`, and the `as` cast operator.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import type { FunctionDescriptor } from '../function-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';
import { asOperator } from '../../operators/binary/index.js';

export const UTILITY_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: 'as', kind: 'infix', arity: 2, precedence: Precedence.Coalesce, associativity: 'left', optionName: 'conversion', pure: true, impl: asOperator }
];

export const UTILITY_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'utility'
);
