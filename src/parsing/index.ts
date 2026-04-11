/**
 * Expression parsing utilities and components.
 *
 * Phase 2.6 deleted the legacy RPN `Instruction` types and `ParserState`
 * cascade — the barrel now exposes only the immutable lexer primitives and
 * AST-emitting Pratt parser.
 */

export * from './token.js';
export * from './token-stream.js';
export { TokenCursor } from './token-cursor.js';
export { PrattParser } from './pratt.js';
