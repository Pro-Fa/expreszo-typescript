import { describe, it, expect } from 'vitest';
import { extractPathPrefix, isPathChar, toTruncatedJsonString, makeTokenStream, iterateTokens } from '../../src/language-service/ls-utils';
import { Parser } from '../../src/parsing/parser';

describe('ls-utils', () => {
  it('extractPathPrefix finds start and prefix across $ and dots', () => {
    const text = ' let $foo.bar_baz = 1';
    const pos = text.indexOf('z') + 1; // position right after last path char
    const { start, prefix } = extractPathPrefix(text, pos);
    expect(prefix).toBe('$foo.bar_baz');
    expect(text.slice(start, pos)).toBe('$foo.bar_baz');
  });

  it('isPathChar allows A-Z, a-z, 0-9, _, $, . and rejects others', () => {
    for (const ch of ['A', 'z', '0', '_', '$', '.']) {
      expect(isPathChar(ch)).toBe(true);
    }
    for (const ch of ['-', ' ', '\n', '+', '(', ')']) {
      expect(isPathChar(ch)).toBe(false);
    }
  });

  it('toTruncatedJsonString returns <empty> for undefined', () => {
    const s = toTruncatedJsonString(undefined);
    expect(s).toBe('<empty>');
  });

  it('toTruncatedJsonString returns <unserializable> for circular objects', () => {
    const a: any = {};
    a.self = a;
    const s = toTruncatedJsonString(a);
    expect(s).toBe('<unserializable>');
  });

  it('toTruncatedJsonString returns readable JSON for small objects within limits', () => {
    const out = toTruncatedJsonString({ a: 1, b: 2 }, 10, 100);
    // Output should be parseable JSON without mid-token splits
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out)).toEqual({ a: 1, b: 2 });
  });

  it('toTruncatedJsonString uses single newlines matching JSON formatting', () => {
    const long = { description: 'alpha beta gamma delta epsilon' };
    const out = toTruncatedJsonString(long, 10, 8);
    // JSON.stringify uses single \n between lines; the output should preserve
    // that structure rather than injecting synthetic \n\n breaks mid-content.
    expect(out).not.toContain('\n\n');
  });

  it('toTruncatedJsonString truncates when exceeding maxLines and appends ellipsis', () => {
    const big: Record<string, number> = {};
    for (let i = 0; i < 20; i++) big['key' + i] = i;
    const out = toTruncatedJsonString(big, 3, 100);
    expect(out.endsWith('...')).toBe(true);
    // Should contain at most maxLines real lines (plus the ellipsis line)
    const lines = out.split('\n');
    expect(lines.length).toBeLessThanOrEqual(4);
    // First real line should be the opening brace, intact
    expect(lines[0]).toBe('{');
  });

  it('toTruncatedJsonString truncates overlong individual lines with ellipsis', () => {
    const long = { text: 'x'.repeat(200) };
    const out = toTruncatedJsonString(long, 10, 20);
    // Long value line should be clipped, with ellipsis, not split across \n\n
    expect(out).toContain('"text"');
    expect(out).toContain('...');
    const lines = out.split('\n');
    for (const line of lines) {
      // Each line (after truncation) should respect maxWidth + ellipsis allowance
      expect(line.length).toBeLessThanOrEqual(23);
    }
  });

  it('iterateTokens can stop early with untilPos', () => {
    const parser = new Parser();
    const text = '1 + 2 * 3';
    const ts = makeTokenStream(parser, text);
    const early = iterateTokens(ts, 2); // somewhere after first token
    expect(early.length).toBeGreaterThan(0);
    expect(early.length).toBeLessThan(5);
  });
});
