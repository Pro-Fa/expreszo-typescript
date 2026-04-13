import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('getSignatureHelp', () => {
  const ls = createLanguageService();

  it('returns the signature with activeParameter=0 at first arg', () => {
    const text = 'pow()';
    const doc = docFrom(text);
    const result = ls.getSignatureHelp({
      textDocument: doc,
      position: doc.positionAt(text.indexOf('(') + 1)
    });
    expect(result).not.toBeNull();
    expect(result!.activeParameter).toBe(0);
    expect(result!.signatures[0].label).toContain('pow');
  });

  it('finds the outermost call and tracks commas for nested calls', () => {
    const text = 'pow(max(1, 2), 3)';
    const doc = docFrom(text);
    // Cursor on the `3` — inside outer pow, second parameter
    const result = ls.getSignatureHelp({
      textDocument: doc,
      position: doc.positionAt(text.indexOf('3'))
    });
    expect(result).not.toBeNull();
    expect(result!.signatures[0].label).toContain('pow');
    expect(result!.activeParameter).toBe(1);
  });

  it('ignores commas inside nested brackets and braces when counting parameters', () => {
    const text = 'pow([1, 2], 3)';
    const doc = docFrom(text);
    const result = ls.getSignatureHelp({
      textDocument: doc,
      position: doc.positionAt(text.indexOf('3'))
    });
    expect(result).not.toBeNull();
    expect(result!.activeParameter).toBe(1);
  });

  it('returns null outside any call', () => {
    const text = '1 + 2';
    const doc = docFrom(text);
    const result = ls.getSignatureHelp({
      textDocument: doc,
      position: doc.positionAt(text.length)
    });
    expect(result).toBeNull();
  });

  it('returns null for unknown function', () => {
    const text = 'nope()';
    const doc = docFrom(text);
    const result = ls.getSignatureHelp({
      textDocument: doc,
      position: doc.positionAt(text.indexOf('(') + 1)
    });
    expect(result).toBeNull();
  });
});
