import type { Position } from 'vscode-languageserver-types';
import type { TextDocument } from 'vscode-languageserver-textdocument';

export type PositionInput =
  | { offset: number }
  | { line: number; character: number };

export function resolvePosition(doc: TextDocument, input: PositionInput): Position {
  if ('offset' in input) {
    return doc.positionAt(input.offset);
  }
  return { line: input.line, character: input.character };
}
