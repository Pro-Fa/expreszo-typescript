/**
 * Type-check preset — `isArray`, `isNumber`, etc.
 */
import type { FunctionDescriptor } from '../function-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';

export const TYPE_CHECK_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'type-check'
);
