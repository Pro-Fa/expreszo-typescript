import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Position, SignatureHelp } from 'vscode-languageserver-types';
import { TNAME, TPAREN, TBRACKET, TBRACE, TCOMMA } from '../parsing';
import type { Parser } from '../parsing/parser';
import { makeTokenStream, iterateTokens, type TokenSpan } from './ls-utils';
import { FunctionDetails } from './language-service.models';

/**
 * Walk left from `cursorOffset` across the token stream, tracking bracket /
 * brace / paren depth, to find the innermost unmatched `(` and the `TNAME`
 * token immediately preceding it. Also counts top-level commas between the
 * open paren and the cursor to derive the active parameter index.
 */
function findEnclosingCall(
  spans: TokenSpan[],
  cursorOffset: number
): { funcName: string; activeParameter: number } | null {
  // Start from the token whose end is <= cursorOffset (scan everything before).
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  let activeParameter = 0;
  // Scan from right to left — the first unmatched `(` we encounter is the
  // innermost enclosing call.
  let callOpenIndex = -1;
  for (let i = spans.length - 1; i >= 0; i--) {
    const sp = spans[i];
    if (sp.start >= cursorOffset) continue;
    const t = sp.token;
    if (t.type === TPAREN) {
      if (t.value === ')') paren++;
      else if (t.value === '(') {
        if (paren === 0) {
          callOpenIndex = i;
          break;
        }
        paren--;
      }
    } else if (t.type === TBRACKET) {
      if (t.value === ']') bracket++;
      else if (t.value === '[') bracket--;
    } else if (t.type === TBRACE) {
      if (t.value === '}') brace++;
      else if (t.value === '{') brace--;
    } else if (t.type === TCOMMA) {
      if (paren === 0 && bracket === 0 && brace === 0) {
        activeParameter++;
      }
    }
  }

  if (callOpenIndex <= 0) return null;

  const nameSpan = spans[callOpenIndex - 1];
  if (nameSpan.token.type !== TNAME) return null;

  return { funcName: String(nameSpan.token.value), activeParameter };
}

export function getSignatureHelp(
  doc: TextDocument,
  parser: Parser,
  position: Position,
  functionNames: Set<string>
): SignatureHelp | null {
  const text = doc.getText();
  const offset = doc.offsetAt(position);

  let spans: TokenSpan[];
  try {
    const stream = makeTokenStream(parser, text);
    spans = iterateTokens(stream);
  } catch {
    return null;
  }

  const found = findEnclosingCall(spans, offset);
  if (!found) return null;
  if (!functionNames.has(found.funcName)) return null;

  const details = new FunctionDetails(parser, found.funcName);
  const sigInfo = details.signatureInformation();

  // Clamp activeParameter to the number of declared parameters.
  const paramCount = sigInfo.parameters?.length ?? 0;
  const active = paramCount > 0 ? Math.min(found.activeParameter, paramCount - 1) : 0;

  return {
    signatures: [sigInfo],
    activeSignature: 0,
    activeParameter: active
  };
}
