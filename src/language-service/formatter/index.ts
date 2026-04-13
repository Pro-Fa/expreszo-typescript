import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { TextEdit } from 'vscode-languageserver-types';
import type { ParseCache } from '../shared/parse-cache.js';
import { getRootNode } from '../shared/positioned-symbols.js';
import { PrettyPrinter, type FormatOptions } from './pretty-printer.js';

export interface FormatParams {
  textDocument: TextDocument;
  options?: FormatOptions;
}

/**
 * Format an expression document. Returns an array with at most one
 * `TextEdit` replacing the whole document. If the document fails to parse,
 * or the formatted output is identical to the input, returns an empty
 * array.
 */
export function format(params: FormatParams, parseCache: ParseCache): TextEdit[] {
  const { textDocument, options } = params;
  const { expression } = parseCache.get(textDocument);
  if (!expression) return [];

  const printer = new PrettyPrinter(textDocument, options);
  const root = getRootNode(expression);
  const formatted = printer.print(root);

  const text = textDocument.getText();
  if (formatted === text) return [];

  return [
    {
      range: {
        start: textDocument.positionAt(0),
        end: textDocument.positionAt(text.length)
      },
      newText: formatted
    }
  ];
}
