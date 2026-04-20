import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { createLanguageService } from '../../src/language-service/language-service';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

function applyEdits(text: string, edits: readonly { range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }[]): string {
  const doc = TextDocument.create('file://test', 'plaintext', 1, text);
  // LSP edits are non-overlapping and must be applied in reverse offset order
  // so earlier edits don't shift later ranges.
  const withOffsets = edits.map(e => ({
    start: doc.offsetAt(e.range.start),
    end: doc.offsetAt(e.range.end),
    newText: e.newText
  }));
  withOffsets.sort((a, b) => b.start - a.start);
  let result = text;
  for (const e of withOffsets) {
    result = result.slice(0, e.start) + e.newText + result.slice(e.end);
  }
  return result;
}

describe('legacy-arg-order diagnostics', () => {
  const ls = createLanguageService();

  function legacyDiagnostics(text: string) {
    const doc = docFrom(text);
    return ls.getDiagnostics({ textDocument: doc }).filter(d => d.code === 'legacy-arg-order');
  }

  it('flags map(fn, array) as legacy', () => {
    const diags = legacyDiagnostics('map(x => x * 2, [1, 2, 3])');
    expect(diags.length).toBe(1);
    expect(diags[0].severity).toBe(DiagnosticSeverity.Information);
    expect(diags[0].message).toContain('map');
  });

  it('does not flag map(array, fn) — preferred order', () => {
    expect(legacyDiagnostics('map([1, 2, 3], x => x * 2)')).toEqual([]);
  });

  it('flags filter, find, some, every with fn-first', () => {
    expect(legacyDiagnostics('filter(x => x > 0, [1, -2, 3])').length).toBe(1);
    expect(legacyDiagnostics('find(x => x > 2, [1, 2, 3])').length).toBe(1);
    expect(legacyDiagnostics('some(x => x > 2, [1, 2, 3])').length).toBe(1);
    expect(legacyDiagnostics('every(x => x > 0, [1, 2, 3])').length).toBe(1);
  });

  it('flags sort with comparator-first', () => {
    expect(legacyDiagnostics('sort((a, b) => a - b, [3, 1, 2])').length).toBe(1);
  });

  it('does not flag single-argument sort(array)', () => {
    expect(legacyDiagnostics('sort([3, 1, 2])')).toEqual([]);
  });

  it('flags fold(fn, init, array) as legacy', () => {
    expect(legacyDiagnostics('fold((acc, x) => acc + x, 0, [1, 2, 3])').length).toBe(1);
  });

  it('flags reduce(fn, init, array) as legacy', () => {
    expect(legacyDiagnostics('reduce((acc, x) => acc + x, 0, [1, 2, 3])').length).toBe(1);
  });

  it('does not flag fold(array, init, fn) — preferred order', () => {
    expect(legacyDiagnostics('fold([1, 2, 3], 0, (acc, x) => acc + x)')).toEqual([]);
  });

  it('flags join(sep, array) as legacy', () => {
    expect(legacyDiagnostics('join(", ", ["a", "b", "c"])').length).toBe(1);
  });

  it('does not flag join(array, sep) — preferred order', () => {
    expect(legacyDiagnostics('join(["a", "b", "c"], ", ")')).toEqual([]);
  });

  it('flags indexOf(number, array) as legacy', () => {
    expect(legacyDiagnostics('indexOf(2, [1, 2, 3])').length).toBe(1);
  });

  it('does not flag indexOf(array, target) — preferred order', () => {
    expect(legacyDiagnostics('indexOf([1, 2, 3], 2)')).toEqual([]);
  });

  it('does not flag ambiguous indexOf(string, string) — preferred is the natural reading', () => {
    // indexOf("hello", "o") is a valid preferred-order call (haystack="hello").
    // With both args as StringLit we can't prove legacy, so we stay quiet.
    expect(legacyDiagnostics('indexOf("hello", "o")')).toEqual([]);
  });

  it('does not flag calls with indeterminate argument types', () => {
    // Bare identifiers could hold anything at runtime — no way to prove legacy.
    expect(legacyDiagnostics('map(myFn, myArray)')).toEqual([]);
    expect(legacyDiagnostics('filter(cb, items)')).toEqual([]);
  });
});

describe('legacy-arg-order quick fix', () => {
  const ls = createLanguageService();

  function applyFixFor(text: string): string {
    const doc = docFrom(text);
    const diag = ls.getDiagnostics({ textDocument: doc }).find(d => d.code === 'legacy-arg-order');
    expect(diag).toBeDefined();
    const actions = ls.getCodeActions({
      textDocument: doc,
      range: diag!.range,
      context: { diagnostics: [diag!] }
    });
    expect(actions.length).toBe(1);
    expect(actions[0].isPreferred).toBe(true);
    expect(actions[0].title).toContain('preferred order');
    const edits = actions[0].edit?.changes?.[doc.uri];
    expect(edits).toBeDefined();
    return applyEdits(text, edits!);
  }

  it('rewrites map(fn, array) to map(array, fn)', () => {
    expect(applyFixFor('map(x => x * 2, [1, 2, 3])'))
      .toBe('map([1, 2, 3], x => x * 2)');
  });

  it('rewrites filter(fn, array) to filter(array, fn)', () => {
    expect(applyFixFor('filter(x => x > 0, [1, -2, 3])'))
      .toBe('filter([1, -2, 3], x => x > 0)');
  });

  it('rewrites fold(fn, init, array) to fold(array, init, fn)', () => {
    expect(applyFixFor('fold((acc, x) => acc + x, 0, [1, 2, 3])'))
      .toBe('fold([1, 2, 3], 0, (acc, x) => acc + x)');
  });

  it('rewrites reduce(fn, init, array) to reduce(array, init, fn)', () => {
    expect(applyFixFor('reduce((acc, x) => acc + x, 1, [2, 3])'))
      .toBe('reduce([2, 3], 1, (acc, x) => acc + x)');
  });

  it('rewrites sort(cmp, array) to sort(array, cmp)', () => {
    expect(applyFixFor('sort((a, b) => a - b, [3, 1, 2])'))
      .toBe('sort([3, 1, 2], (a, b) => a - b)');
  });

  it('rewrites join(sep, array) to join(array, sep)', () => {
    expect(applyFixFor('join(", ", ["a", "b", "c"])'))
      .toBe('join(["a", "b", "c"], ", ")');
  });

  it('rewrites indexOf(target, array) to indexOf(array, target)', () => {
    expect(applyFixFor('indexOf(2, [1, 2, 3])'))
      .toBe('indexOf([1, 2, 3], 2)');
  });
});
