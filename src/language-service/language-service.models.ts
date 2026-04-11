import { Parser } from '../parsing/parser';
import { BUILTIN_FUNCTIONS_BY_NAME } from '../registry/builtin/functions.js';
import type { FunctionDocs, FunctionParamDoc } from '../registry/function-descriptor.js';
import type { ArityInfo } from './language-service.types';

export class FunctionDetails {
  private readonly docBlock: FunctionDocs | undefined;

  constructor(private readonly parser: Parser, public readonly name: string) {
    this.docBlock = BUILTIN_FUNCTIONS_BY_NAME.get(this.name)?.docs;
  }

  private params(): readonly FunctionParamDoc[] {
    return this.docBlock?.params ?? [];
  }

  private arity(): number | undefined {
    if (this.docBlock) return this.params().length;
    const f: unknown = (this.parser.functions && this.parser.functions[this.name]) || (this.parser.unaryOps && this.parser.unaryOps[this.name]);
    return typeof f === 'function' ? f.length : undefined;
  }

  /**
   * Returns the arity information for this function:
   * - min: minimum number of required arguments
   * - max: maximum number of arguments, or undefined if variadic
   */
  public arityInfo(): ArityInfo | undefined {
    if (this.docBlock) {
      const params = this.params();
      if (params.length === 0) return { min: 0, max: 0 };

      const hasVariadic = params.some((p) => p.isVariadic);
      const requiredParams = params.filter((p) => !p.optional && !p.isVariadic);
      const optionalParams = params.filter((p) => p.optional && !p.isVariadic);

      const min = requiredParams.length;
      const max = hasVariadic ? undefined : requiredParams.length + optionalParams.length;

      return { min, max };
    }

    const f: unknown = (this.parser.functions && this.parser.functions[this.name]) || (this.parser.unaryOps && this.parser.unaryOps[this.name]);
    if (typeof f === 'function') {
      return { min: f.length, max: f.length };
    }
    return undefined;
  }

  public docs(): string | undefined {
    if (this.docBlock) {
      const params = this.params();
      const paramList = params.map((p) => `* \`${p.name}\`: ${p.description}`).join('\n');
      return `**${this.details()}**\n\n${this.docBlock.description}\n\n*Parameters:*\n${paramList}`;
    }

    if (this.parser.unaryOps && this.parser.unaryOps[this.name]) {
      return `${this.name} x: unary operator`;
    }

    return undefined;
  }

  public details(): string {
    if (this.docBlock) {
      const params = this.params();
      return `${this.name}(${params.map((p) => p.name).join(', ')})`;
    }

    const arity = this.arity();
    return arity != null
      ? `${this.name}(${Array.from({ length: arity }).map((_, i) => 'arg' + (i + 1)).join(', ')})`
      : `${this.name}(…)`;
  }

  public completionText(): string {
    if (this.docBlock) {
      const params = this.params();
      return `${this.name}(${params.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ')})`;
    }

    const arity = this.arity();
    return arity != null
      ? `${this.name}(${Array.from({ length: arity }).map((_, i) => `\${${i + 1}}`).join(', ')})`
      : `${this.name}(…)`;
  }
}
