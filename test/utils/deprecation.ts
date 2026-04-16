import { describe, it, expect, vi, afterEach } from 'vitest';
import { warnOnce, setDeprecationHandler } from '../../src/utils/deprecation.js';

describe('deprecation', () => {
  afterEach(() => {
    setDeprecationHandler(undefined);
  });

  describe('warnOnce', () => {
    it('should call console.warn with default behavior', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnOnce('default-warn-test', 'use newFunc instead');
      expect(spy).toHaveBeenCalledWith('[expreszo] Deprecated: use newFunc instead');
      spy.mockRestore();
    });

    it('should only warn once per key (duplicate calls)', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnOnce('duplicate-key-test', 'first call');
      warnOnce('duplicate-key-test', 'second call');
      warnOnce('duplicate-key-test', 'third call');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[expreszo] Deprecated: first call');
      spy.mockRestore();
    });

    it('should warn separately for different keys', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnOnce('key-a', 'message A');
      warnOnce('key-b', 'message B');
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('[expreszo] Deprecated: message A');
      expect(spy).toHaveBeenCalledWith('[expreszo] Deprecated: message B');
      spy.mockRestore();
    });
  });

  describe('setDeprecationHandler', () => {
    it('should accept a custom handler', () => {
      const handler = vi.fn();
      setDeprecationHandler(handler);
      warnOnce('custom-handler-test', 'custom message');
      expect(handler).toHaveBeenCalledWith('custom-handler-test', 'custom message');
    });

    it('should use the custom handler instead of console.warn', () => {
      const handler = vi.fn();
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setDeprecationHandler(handler);
      warnOnce('custom-no-console-test', 'routed to handler');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should revert to console.warn when set to undefined', () => {
      const handler = vi.fn();
      setDeprecationHandler(handler);
      warnOnce('revert-step1', 'handled');
      expect(handler).toHaveBeenCalledTimes(1);

      setDeprecationHandler(undefined);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnOnce('revert-step2', 'back to console');
      expect(spy).toHaveBeenCalledWith('[expreszo] Deprecated: back to console');
      expect(handler).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});
