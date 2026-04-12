export type DeprecationHandler = (key: string, message: string) => void;

const warned = new Set<string>();
let customHandler: DeprecationHandler | undefined;

export function setDeprecationHandler(handler: DeprecationHandler | undefined): void {
  customHandler = handler;
}

export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  if (customHandler) {
    customHandler(key, message);
  } else {
    console.warn(`[expreszo] Deprecated: ${message}`);
  }
}
