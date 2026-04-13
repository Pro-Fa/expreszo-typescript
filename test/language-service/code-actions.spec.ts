import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

describe('getCodeActions', () => {
  const ls = createLanguageService();

  it('offers a quick fix that inserts missing arguments for arity-too-few', () => {
    const text = 'pow(1)';
    const doc = docFrom(text);
    const diagnostics = ls.getDiagnostics({ textDocument: doc });
    const arityDiag = diagnostics.find(d => d.code === 'arity-too-few');
    expect(arityDiag).toBeDefined();

    const actions = ls.getCodeActions({
      textDocument: doc,
      range: arityDiag!.range,
      context: { diagnostics: [arityDiag!] }
    });
    expect(actions.length).toBe(1);
    expect(actions[0].title).toContain('pow');
    const edit = actions[0].edit?.changes?.[doc.uri]?.[0];
    expect(edit?.newText).toContain('0');
  });

  it('offers "did you mean" for a typo resembling a builtin', () => {
    const text = 'pwo(1, 2)';
    const doc = docFrom(text);
    const diagnostics = ls.getDiagnostics({ textDocument: doc, variables: {} });
    const unknown = diagnostics.find(d => d.code === 'unknown-ident');
    expect(unknown).toBeDefined();

    const actions = ls.getCodeActions({
      textDocument: doc,
      range: unknown!.range,
      context: { diagnostics: [unknown!], variables: {} }
    });
    expect(actions.length).toBe(1);
    expect(actions[0].title.toLowerCase()).toContain('pow');
    const edit = actions[0].edit?.changes?.[doc.uri]?.[0];
    expect(edit?.newText).toBe('pow');
  });

  it('returns no action for a large typo', () => {
    const text = 'xyzzy(1)';
    const doc = docFrom(text);
    const diagnostics = ls.getDiagnostics({ textDocument: doc, variables: {} });
    const unknown = diagnostics.find(d => d.code === 'unknown-ident');
    expect(unknown).toBeDefined();

    const actions = ls.getCodeActions({
      textDocument: doc,
      range: unknown!.range,
      context: { diagnostics: [unknown!], variables: {} }
    });
    expect(actions).toEqual([]);
  });

  it('returns empty when no actionable diagnostics are passed', () => {
    const doc = docFrom('1 + 1');
    const actions = ls.getCodeActions({
      textDocument: doc,
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      context: { diagnostics: [] }
    });
    expect(actions).toEqual([]);
  });
});
