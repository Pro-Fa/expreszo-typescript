import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import type { Parser } from '../parsing/parser';
import type { Values } from '../types';
import type { ParseCache } from './shared/parse-cache.js';
import { collectPositionedSymbols } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';

function buildKnownNames(parser: Parser, variables: Values | undefined): Set<string> {
  const known = new Set<string>();
  if (parser.functions) for (const k of Object.keys(parser.functions)) known.add(k);
  if (parser.unaryOps) for (const k of Object.keys(parser.unaryOps)) known.add(k);
  if (parser.numericConstants) for (const k of Object.keys(parser.numericConstants)) known.add(k);
  if (parser.buildInLiterals) for (const k of Object.keys(parser.buildInLiterals)) known.add(k);
  if (parser.keywords) for (const k of parser.keywords) known.add(k);
  if (variables) {
    for (const k of Object.keys(variables)) known.add(k);
  }
  return known;
}

/**
 * Emit a `DiagnosticSeverity.Warning` for every identifier/name-ref in the
 * expression whose name is not recognized as a built-in and not listed in the
 * provided `variables` map. Returns an empty array when `variables` is
 * omitted — the check is opt-in per-request.
 */
export function getUnknownIdentDiagnostics(
  doc: TextDocument,
  parser: Parser,
  parseCache: ParseCache,
  variables: Values | undefined
): Diagnostic[] {
  if (!variables) return [];
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const known = buildKnownNames(parser, variables);
  const symbols = collectPositionedSymbols(expression);

  const out: Diagnostic[] = [];
  const reported = new Set<string>();
  for (const sym of symbols) {
    // Member chains are recognized if their root variable is known.
    if (known.has(sym.name)) continue;
    const key = sym.name + '@' + sym.span.start + '@' + sym.span.end;
    if (reported.has(key)) continue;
    reported.add(key);
    out.push({
      range: spanToRange(doc, sym.span),
      severity: DiagnosticSeverity.Warning,
      message: `Unknown identifier '${sym.name}'.`,
      source: 'expreszo',
      code: 'unknown-ident'
    });
  }
  return out;
}
