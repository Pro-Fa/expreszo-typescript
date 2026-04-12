/**
 * Binary comparison operators
 * Handles equality and relational comparisons: ==, !=, <, >, <=, >=
 */

export function equal(a: any, b: any): boolean {
  return a === b;
}

export function notEqual(a: any, b: any): boolean {
  return a !== b;
}

export function greaterThan(a: any, b: any): boolean | undefined {
  if (a === undefined || b === undefined) return undefined;
  return a > b;
}

export function lessThan(a: any, b: any): boolean | undefined {
  if (a === undefined || b === undefined) return undefined;
  return a < b;
}

export function greaterThanEqual(a: any, b: any): boolean | undefined {
  if (a === undefined || b === undefined) return undefined;
  return a >= b;
}

export function lessThanEqual(a: any, b: any): boolean | undefined {
  if (a === undefined || b === undefined) return undefined;
  return a <= b;
}

export function greaterThanLegacy(a: any, b: any): boolean {
  return a > b;
}

export function lessThanLegacy(a: any, b: any): boolean {
  return a < b;
}

export function greaterThanEqualLegacy(a: any, b: any): boolean {
  return a >= b;
}

export function lessThanEqualLegacy(a: any, b: any): boolean {
  return a <= b;
}
