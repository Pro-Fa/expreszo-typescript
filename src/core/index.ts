/**
 * Core evaluation engine
 *
 * Phase 2.5 flipped Expression to hold an AST root instead of RPN
 * instructions. The legacy `simplify`/`substitute`/`evaluate`/
 * `expressionToString`/`getSymbols` modules were replaced by AST
 * visitors under `src/ast/visitors/` and `src/eval/` — Phase 2.6
 * deletes the dead files.
 */

export { Expression } from './expression.js';
export { default as contains } from './contains.js';
