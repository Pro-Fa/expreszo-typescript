import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createLanguageService } from '../../src/language-service/language-service';
import { SEMANTIC_TOKENS_LEGEND } from '../../src/language-service/semantic-tokens';

function docFrom(text: string): TextDocument {
  return TextDocument.create('file://test', 'plaintext', 1, text);
}

type Tuple = { deltaLine: number; deltaStart: number; length: number; type: number };

function decode(data: readonly number[]): Tuple[] {
  const out: Tuple[] = [];
  for (let i = 0; i < data.length; i += 5) {
    out.push({
      deltaLine: data[i],
      deltaStart: data[i + 1],
      length: data[i + 2],
      type: data[i + 3]
    });
  }
  return out;
}

describe('getSemanticTokens', () => {
  const ls = createLanguageService();

  it('encodes a single-line expression into LSP 5-tuples', () => {
    const doc = docFrom('pow(x, 2) + 1');
    const tokens = decode(ls.getSemanticTokens({ textDocument: doc }).data);
    // All tokens on line 0; every deltaLine should be 0
    expect(tokens.every(t => t.deltaLine === 0)).toBe(true);
    // There should be a `function` token for pow and a `number` token for 1
    const types = tokens.map(t => t.type);
    expect(types).toContain(SEMANTIC_TOKENS_LEGEND.tokenTypes.indexOf('function'));
    expect(types).toContain(SEMANTIC_TOKENS_LEGEND.tokenTypes.indexOf('number'));
  });

  it('produces a non-zero deltaLine when crossing lines', () => {
    const doc = docFrom('1 +\n2');
    const tokens = decode(ls.getSemanticTokens({ textDocument: doc }).data);
    expect(tokens.some(t => t.deltaLine > 0)).toBe(true);
  });

  it('uses the stable legend', () => {
    expect(SEMANTIC_TOKENS_LEGEND.tokenTypes).toMatchInlineSnapshot(`
      [
        "keyword",
        "function",
        "variable",
        "namespace",
        "number",
        "string",
        "operator",
        "comment",
      ]
    `);
  });
});
