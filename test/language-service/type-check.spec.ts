import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('type-mismatch diagnostics', () => {
  const ls = createLanguageService();

  function typeDiagnostics(text: string) {
    const doc = docFrom(text);
    return ls.getDiagnostics({ textDocument: doc }).filter(d => d.code === 'type-mismatch');
  }

  it('warns when a string literal is passed where a number is expected', () => {
    const diagnostics = typeDiagnostics('pow("x", 2)');
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Warning);
    expect(diagnostics[0].message).toContain('number');
    expect(diagnostics[0].message).toContain('string');
  });

  it('does not warn when the literal matches the expected type', () => {
    expect(typeDiagnostics('pow(2, 3)')).toEqual([]);
  });

  it('does not warn on non-literal (variable) arguments', () => {
    expect(typeDiagnostics('pow(someVar, 2)')).toEqual([]);
  });

  it('treats every variadic position as the declared type', () => {
    expect(typeDiagnostics('max(1, 2, 3)')).toEqual([]);
  });

  it('flags a variadic string-typed literal mismatch', () => {
    // max is variadic number; any string literal must warn
    const diagnostics = typeDiagnostics('max(1, "two", 3)');
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain('number');
  });

  it('warns when a number literal is passed where a string is expected', () => {
    const diagnostics = typeDiagnostics('contains(1, "x")');
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain('string');
    expect(diagnostics[0].message).toContain('number');
  });

  it('is idempotent across repeated calls', () => {
    const first = typeDiagnostics('pow("x", 2)');
    const second = typeDiagnostics('pow("x", 2)');
    expect(second).toEqual(first);
  });
});
