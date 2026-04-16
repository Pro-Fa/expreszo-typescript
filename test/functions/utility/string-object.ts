import { describe, it, expect } from 'vitest';
import { json } from '../../../src/functions/utility/string-object.js';

describe('json', () => {
  it('should return undefined when content is undefined', () => {
    expect(json(undefined)).toBeUndefined();
  });

  it('should stringify an object', () => {
    expect(json({ a: 1 })).toBe('{"a":1}');
  });

  it('should stringify an array', () => {
    expect(json([1, 2, 3])).toBe('[1,2,3]');
  });

  it('should stringify a string', () => {
    expect(json('hello')).toBe('"hello"');
  });

  it('should stringify null', () => {
    expect(json(null)).toBe('null');
  });

  it('should stringify a number', () => {
    expect(json(42)).toBe('42');
  });

  it('should stringify a boolean', () => {
    expect(json(true)).toBe('true');
  });
});
