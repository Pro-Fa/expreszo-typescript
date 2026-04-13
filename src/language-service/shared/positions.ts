import type { Range } from 'vscode-languageserver-types';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Span } from '../../ast/nodes.js';

export function spanToRange(doc: TextDocument, span: Span): Range {
  return {
    start: doc.positionAt(span.start),
    end: doc.positionAt(span.end)
  };
}

export function offsetInSpan(offset: number, span: Span): boolean {
  return offset >= span.start && offset <= span.end;
}
