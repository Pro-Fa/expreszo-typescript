/**
 * Object preset — object manipulation functions (merge, keys, values, flatten).
 */
import type { FunctionDescriptor } from '../function-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';

export const OBJECT_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'object'
);
