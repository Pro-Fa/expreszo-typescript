import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('getDefinition / getReferences', () => {
  const ls = createLanguageService();

  it('finds all references to an identifier', () => {
    const doc = docFrom('x + x * x');
    // Cursor on the second "x" (index 4)
    const refs = ls.getReferences({ textDocument: doc, position: doc.positionAt(4) });
    expect(refs.length).toBe(3);
    const starts = refs.map(r => r.range.start.character).sort((a, b) => a - b);
    expect(starts).toEqual([0, 4, 8]);
  });

  it('definition is the first occurrence', () => {
    const doc = docFrom('x + x * x');
    const def = ls.getDefinition({ textDocument: doc, position: doc.positionAt(8) });
    expect(def).not.toBeNull();
    expect(def?.range.start.character).toBe(0);
  });

  it('member property names are not matched by bare identifier', () => {
    const doc = docFrom('a.b + b');
    // Cursor on bare b (index 6)
    const refs = ls.getReferences({ textDocument: doc, position: doc.positionAt(6) });
    // Only the bare b should match, not the `b` in `a.b`
    expect(refs.length).toBe(1);
    expect(refs[0].range.start.character).toBe(6);
  });

  it('returns empty for a number literal', () => {
    const doc = docFrom('1 + 2');
    const refs = ls.getReferences({ textDocument: doc, position: doc.positionAt(0) });
    expect(refs).toEqual([]);
    const def = ls.getDefinition({ textDocument: doc, position: doc.positionAt(0) });
    expect(def).toBeNull();
  });

  it('returns empty for unparseable input', () => {
    const doc = docFrom('x + ');
    const refs = ls.getReferences({ textDocument: doc, position: doc.positionAt(0) });
    expect(refs).toEqual([]);
  });
});
