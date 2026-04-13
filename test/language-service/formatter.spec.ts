import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

function formatOnce(ls: ReturnType<typeof createLanguageService>, text: string): string {
  const doc = docFrom(text);
  const edits = ls.format({ textDocument: doc });
  if (edits.length === 0) return text;
  return edits[0].newText;
}

describe('format', () => {
  const ls = createLanguageService();

  it('inserts spaces around binary operators', () => {
    expect(formatOnce(ls, '1+2')).toBe('1 + 2');
  });

  it('normalizes function call whitespace', () => {
    expect(formatOnce(ls, 'pow(  2  ,3)')).toBe('pow(2, 3)');
  });

  it('leaves a well-formatted expression alone (no edits)', () => {
    const doc = docFrom('pow(2, 3)');
    expect(ls.format({ textDocument: doc })).toEqual([]);
  });

  it('keeps a single-line array literal single-line', () => {
    expect(formatOnce(ls, '[1,2,3]')).toBe('[1, 2, 3]');
  });

  it('preserves an explicit grouping via paren nodes', () => {
    // parser emits Paren for explicit parentheses that are not redundant
    expect(formatOnce(ls, '(1+2)*3')).toBe('(1 + 2) * 3');
  });

  it('is idempotent on the simple cases', () => {
    const cases = ['1 + 2', 'pow(2, 3)', '[1, 2, 3]', '(1 + 2) * 3', 'a.b + c'];
    for (const c of cases) {
      const once = formatOnce(ls, c);
      const twice = formatOnce(ls, once);
      expect(twice).toBe(once);
    }
  });

  it('returns an empty edit array when parsing fails', () => {
    const doc = docFrom('1 + (');
    expect(ls.format({ textDocument: doc })).toEqual([]);
  });
});
