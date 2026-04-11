/**
 * Descriptor-based registry barrel. Phase 2 scaffolds the catalog alongside
 * the hand-rolled `Parser` wiring; later phases consume it from the Pratt
 * parser, validator, and language-service.
 */
export type { OperatorDescriptor, OperatorKind, OperatorAssociativity, PrecedenceLevel } from './operator-descriptor.js';
export { Precedence } from './operator-descriptor.js';
export type { FunctionDescriptor, FunctionCategory } from './function-descriptor.js';
export { BINARY_OPERATORS, UNARY_OPERATORS, TERNARY_OPERATORS, ALL_OPERATORS } from './builtin/operators.js';
export { BUILTIN_FUNCTIONS } from './builtin/functions.js';
