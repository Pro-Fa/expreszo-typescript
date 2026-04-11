/**
 * Array preset — array-category functions (map, fold, filter, etc.).
 */
import type { FunctionDescriptor } from '../function-descriptor.js';
import { BUILTIN_FUNCTIONS } from '../builtin/functions.js';

export const ARRAY_FUNCTIONS: readonly FunctionDescriptor[] = BUILTIN_FUNCTIONS.filter(
  (d) => d.category === 'array'
);
