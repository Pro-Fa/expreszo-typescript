/**
 * Logical preset — `and` / `or` / `not` and their symbolic aliases.
 */
import type { OperatorDescriptor } from '../operator-descriptor.js';
import { Precedence } from '../operator-descriptor.js';
import { andOperator, orOperator } from '../../operators/binary/index.js';
import { not } from '../../operators/unary/index.js';

export const LOGICAL_OPERATORS: readonly OperatorDescriptor[] = [
  { symbol: 'or',  kind: 'infix',  arity: 2, precedence: Precedence.Or,     associativity: 'left',  optionName: 'logical', pure: true, impl: orOperator },
  { symbol: '||',  kind: 'infix',  arity: 2, precedence: Precedence.Or,     associativity: 'left',  optionName: 'logical', pure: true, impl: orOperator },
  { symbol: 'and', kind: 'infix',  arity: 2, precedence: Precedence.And,    associativity: 'left',  optionName: 'logical', pure: true, impl: andOperator },
  { symbol: '&&',  kind: 'infix',  arity: 2, precedence: Precedence.And,    associativity: 'left',  optionName: 'logical', pure: true, impl: andOperator },
  { symbol: 'not', kind: 'prefix', arity: 1, precedence: Precedence.Prefix, associativity: 'right', optionName: 'logical', pure: true, impl: not }
];
