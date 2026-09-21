/**
 * Property writes for objects whose keys come from expression data.
 *
 * Plain assignment (and `Object.assign`) of a `__proto__` key invokes the
 * inherited setter and replaces the target's prototype. Defining the key as
 * an own data property keeps it inert.
 */

export function setOwnProperty(target: Record<string, any>, key: string, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    target[key] = value;
  }
}

export function assignOwnProperties(target: Record<string, any>, source: Record<string, any>): void {
  for (const key of Object.keys(source)) {
    setOwnProperty(target, key, source[key]);
  }
}
