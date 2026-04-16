import { describe, it, expect } from 'vitest';
import { condition } from '../../../src/functions/utility/conditional.js';

describe('condition', () => {
  it('should return yep when condition is truthy', () => {
    expect(condition(true, 'yes', 'no')).toBe('yes');
  });

  it('should return nope when condition is false', () => {
    expect(condition(false, 'yes', 'no')).toBe('no');
  });

  it('should return nope when condition is 0', () => {
    expect(condition(0, 'yes', 'no')).toBe('no');
  });

  it('should return nope when condition is empty string', () => {
    expect(condition('', 'yes', 'no')).toBe('no');
  });

  it('should return nope when condition is null', () => {
    expect(condition(null, 'yes', 'no')).toBe('no');
  });

  it('should return nope when condition is undefined', () => {
    expect(condition(undefined, 'yes', 'no')).toBe('no');
  });

  it('should return nope when condition is NaN', () => {
    expect(condition(NaN, 'yes', 'no')).toBe('no');
  });

  it('should return yep when condition is 1', () => {
    expect(condition(1, 'yes', 'no')).toBe('yes');
  });

  it('should return yep when condition is a non-empty string', () => {
    expect(condition('string', 'yes', 'no')).toBe('yes');
  });

  it('should return yep when condition is an empty array', () => {
    expect(condition([], 'yes', 'no')).toBe('yes');
  });

  it('should return yep when condition is an empty object', () => {
    expect(condition({}, 'yes', 'no')).toBe('yes');
  });
});
