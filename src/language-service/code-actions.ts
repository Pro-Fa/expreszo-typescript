import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { CodeAction, Diagnostic, Range } from 'vscode-languageserver-types';
import { CodeActionKind } from 'vscode-languageserver-types';
import type { Parser } from '../parsing/parser';
import type { Values } from '../types/values.js';
import { closestMatch } from './shared/levenshtein.js';
import { FunctionDetails } from './language-service.models.js';

export interface GetCodeActionsParams {
  textDocument: TextDocument;
  range: Range;
  context: {
    diagnostics: readonly Diagnostic[];
    variables?: Values;
  };
}

function buildKnownNames(parser: Parser, variables: Values | undefined): string[] {
  const known = new Set<string>();
  if (parser.functions) for (const k of Object.keys(parser.functions)) known.add(k);
  if (parser.unaryOps) for (const k of Object.keys(parser.unaryOps)) known.add(k);
  if (parser.numericConstants) for (const k of Object.keys(parser.numericConstants)) known.add(k);
  if (parser.buildInLiterals) for (const k of Object.keys(parser.buildInLiterals)) known.add(k);
  if (parser.keywords) for (const k of parser.keywords) known.add(k);
  if (variables) for (const k of Object.keys(variables)) known.add(k);
  return Array.from(known);
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
  const existingCount = trimmed.length === 0 ? 0 : inner.split(',').length;
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
  const knownNames = buildKnownNames(parser, params.context.variables);
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
