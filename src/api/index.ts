export { defineParser } from './define-parser.js';
export type { ParserConfig } from './define-parser.js';
export {
  coreParser,
  withComparison,
  withLogical,
  withMath,
  withString,
  withArray,
  withObject,
  withTypeCheck,
  withUtility,
  fullParser
} from './presets.js';
export type { ParserPreset } from './presets.js';
