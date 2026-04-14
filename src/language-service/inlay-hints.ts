import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { InlayHint, InlayHintKind, Range } from 'vscode-languageserver-types';
import { BUILTIN_FUNCTIONS_BY_NAME } from '../registry/builtin/functions.js';
import { walk } from '../ast/visitor.js';
import type { Call, Node } from '../ast/nodes.js';
import type { ParseCache } from './shared/parse-cache.js';
import { getRootNode } from './shared/positioned-symbols.js';

function calleeName(callee: Node): string | null {
  if (callee.type === 'Ident' || callee.type === 'NameRef') return callee.name;
  return null;
}

function positionInRange(line: number, character: number, range: Range): boolean {
  if (line < range.start.line) return false;
  if (line === range.start.line && character < range.start.character) return false;
  if (line > range.end.line) return false;
  if (line === range.end.line && character > range.end.character) return false;
  return true;
}

/**
 * Returns LSP inlay hints for the document. Parameter-name hints are emitted
 * before each argument of built-in functions with two or more parameters,
 * making call sites self-documenting without requiring the user to open
 * signature help.
 *
 * Single-parameter functions are intentionally skipped — the label adds noise
 * when the argument's purpose is already obvious (e.g., `sin(x)`).
 *
 * @param range - Optional viewport range; hints outside it are excluded.
 */
export function getInlayHints(
  doc: TextDocument,
  parseCache: ParseCache,
  range?: Range
): InlayHint[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const root = getRootNode(expression);
  const hints: InlayHint[] = [];

  walk(root, (node) => {
    if (node.type !== 'Call') return;
    const call = node as Call;
    const name = calleeName(call.callee);
    if (!name) return;

    const descriptor = BUILTIN_FUNCTIONS_BY_NAME.get(name);
    const params = descriptor?.docs?.params;
    // Only annotate functions with documented multi-param signatures.
    if (!params || params.length <= 1) return;

    for (let i = 0; i < call.args.length; i++) {
      const arg = call.args[i];
      // For variadic functions the last named param covers all trailing args.
      const paramIdx = i < params.length ? i : params.length - 1;
      const param = params[paramIdx];
      if (!param) continue;

      const pos = doc.positionAt(arg.span.start);
      if (range && !positionInRange(pos.line, pos.character, range)) continue;

      hints.push({
        position: pos,
        label: `${param.name}:`,
        kind: 2 as InlayHintKind, // InlayHintKind.Parameter
        paddingRight: true
      });
    }
  });

  return hints;
}
