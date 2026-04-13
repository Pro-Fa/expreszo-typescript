import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolKind } from 'vscode-languageserver-types';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('getDocumentSymbols', () => {
  const ls = createLanguageService();

  it('returns one entry per function call', () => {
    const doc = docFrom('sin(1) + max(2, 3)');
    const symbols = ls.getDocumentSymbols({ textDocument: doc });
    const names = symbols.map(s => s.name).sort();
    expect(names).toEqual(['max', 'sin']);
    expect(symbols.every(s => s.kind === SymbolKind.Function)).toBe(true);
  });

  it('dedups repeated variables to a single entry', () => {
    const doc = docFrom('a + b * a');
    const symbols = ls.getDocumentSymbols({ textDocument: doc });
    const variables = symbols.filter(s => s.kind === SymbolKind.Variable).map(s => s.name).sort();
    expect(variables).toEqual(['a', 'b']);
  });

  it('mixes functions, variables and members', () => {
    const doc = docFrom('user.age + max(user.height, 1)');
    const symbols = ls.getDocumentSymbols({ textDocument: doc });
    const names = symbols.map(s => s.name);
    expect(names).toContain('max');
    expect(names).toContain('user.age');
    expect(names).toContain('user.height');
    const max = symbols.find(s => s.name === 'max');
    expect(max?.kind).toBe(SymbolKind.Function);
    const age = symbols.find(s => s.name === 'user.age');
    expect(age?.kind).toBe(SymbolKind.Field);
  });

  it('returns empty array for unparseable input', () => {
    const doc = docFrom('1 + ');
    const symbols = ls.getDocumentSymbols({ textDocument: doc });
    expect(symbols).toEqual([]);
  });
});
