import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { CodeAction, Diagnostic } from 'vscode-languageserver-types';
import { CodeActionKind } from 'vscode-languageserver-types';
import type { Parser } from '../parsing/parser';
import { closestMatch } from './shared/levenshtein.js';
import { buildKnownNames } from './shared/known-names.js';
import { FunctionDetails } from './language-service.models.js';
import type { GetCodeActionsParams } from './language-service.types.js';

/**
 * Count the number of top-level comma-separated arguments in the raw text
 * between a function's outer parentheses. Handles nested parens/brackets/braces
 * and string literals so inner commas are not mistakenly counted.
 */
function countTopLevelArgs(inner: string): number {
  const trimmed = inner.trim();
  if (!trimmed) return 0;
  let depth = 0;
  let count = 1;
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      if (ch === '\\' && i + 1 < inner.length) { i++; continue; }
      if (ch === strChar) inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strChar = ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      count++;
    }
  }
  return count;
}

function arityQuickFix(
  doc: TextDocument,
  parser: Parser,
  diagnostic: Diagnostic,
  functionNames: Set<string>
): CodeAction | null {
  const match = /^Function '([^']+)' expects at least (\d+) argument/.exec(
    typeof diagnostic.message === 'string' ? diagnostic.message : ''
  );
  if (!match) return null;
  const funcName = match[1];
  const minExpected = Number(match[2]);
  if (!functionNames.has(funcName)) return null;

  const text = doc.getText();
  const startOffset = doc.offsetAt(diagnostic.range.start);
  const endOffset = doc.offsetAt(diagnostic.range.end);

  const closeParenOffset = text.lastIndexOf(')', endOffset - 1);
  if (closeParenOffset < startOffset) return null;
  const openParenOffset = text.indexOf('(', startOffset);
  if (openParenOffset < 0 || openParenOffset > closeParenOffset) return null;

  const inner = text.slice(openParenOffset + 1, closeParenOffset);
  const trimmed = inner.trim();

  const details = new FunctionDetails(parser, funcName);
  const paramDocs = details.params();
  const existingCount = trimmed.length === 0 ? 0 : countTopLevelArgs(inner);
  const missing = minExpected - existingCount;
  if (missing <= 0) return null;

  const additions: string[] = [];
  for (let i = 0; i < missing; i++) {
    const paramIndex = existingCount + i;
    const paramType = paramDocs[paramIndex]?.type;
    additions.push(paramType === 'string' ? '""' : paramType === 'array' ? '[]' : paramType === 'object' ? '{}' : paramType === 'boolean' ? 'false' : '0');
  }

  const newText = (trimmed.length === 0 ? '' : ', ') + additions.join(', ');
  const insertPos = doc.positionAt(closeParenOffset);

  return {
    title: `Add missing argument${missing === 1 ? '' : 's'} to '${funcName}'`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [doc.uri]: [
          {
            range: { start: insertPos, end: insertPos },
            newText
          }
        ]
      }
    }
  };
}

function didYouMeanQuickFix(
  doc: TextDocument,
  diagnostic: Diagnostic,
  knownNames: string[]
): CodeAction | null {
  const match = /^Unknown identifier '([^']+)'/.exec(
    typeof diagnostic.message === 'string' ? diagnostic.message : ''
  );
  if (!match) return null;
  const unknown = match[1];
  const best = closestMatch(unknown, knownNames, 2);
  if (!best || best.match === unknown) return null;

  return {
    title: `Did you mean '${best.match}'?`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [doc.uri]: [
          {
            range: diagnostic.range,
            newText: best.match
          }
        ]
      }
    }
  };
}

export function getCodeActions(
  params: GetCodeActionsParams,
  parser: Parser,
  functionNames: Set<string>
): CodeAction[] {
  const knownNames = Array.from(buildKnownNames(parser, params.context.variables));
  const out: CodeAction[] = [];

  for (const diagnostic of params.context.diagnostics) {
    if (diagnostic.code === 'arity-too-few') {
      const action = arityQuickFix(params.textDocument, parser, diagnostic, functionNames);
      if (action) out.push(action);
    } else if (diagnostic.code === 'unknown-ident') {
      const action = didYouMeanQuickFix(params.textDocument, diagnostic, knownNames);
      if (action) out.push(action);
    }
  }

  return out;
}
