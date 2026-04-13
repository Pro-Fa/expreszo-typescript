import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('getFoldingRanges', () => {
  const ls = createLanguageService();

  it('returns a fold for a multi-line case block', () => {
    const text = [
      'case',
      '  when x > 0 then 1',
      '  else 0',
      'end'
    ].join('\n');
    const folds = ls.getFoldingRanges({ textDocument: docFrom(text) });
    expect(folds.length).toBeGreaterThanOrEqual(1);
    const caseFold = folds.find(f => f.startLine === 0 && f.endLine === 3);
    expect(caseFold).toBeDefined();
  });

  it('returns no folds for a single-line array literal', () => {
    const folds = ls.getFoldingRanges({ textDocument: docFrom('[1, 2, 3]') });
    expect(folds).toEqual([]);
  });

  it('returns a fold for multi-line object literals', () => {
    const text = '{\n  a: 1,\n  b: 2\n}';
    const folds = ls.getFoldingRanges({ textDocument: docFrom(text) });
    expect(folds.some(f => f.startLine === 0 && f.endLine === 3)).toBe(true);
  });

  it('returns folds for nested multi-line objects', () => {
    const text = '{\n  outer: {\n    inner: 1\n  }\n}';
    const folds = ls.getFoldingRanges({ textDocument: docFrom(text) });
    expect(folds.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for unparseable input', () => {
    const folds = ls.getFoldingRanges({ textDocument: docFrom('1 +') });
    expect(folds).toEqual([]);
  });
});
