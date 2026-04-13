import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLanguageService } from '../language-service/language-service.js';
import type { LanguageServiceOptions } from '../language-service/language-service.types.js';
import { registerTools } from './tools.js';

export interface CreateMcpServerOptions {
  operators?: LanguageServiceOptions['operators'];
  name?: string;
  version?: string;
}

export function createMcpServer(options: CreateMcpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: options.name ?? 'expreszo-mcp',
    version: options.version ?? '0.3.0'
  });

  const ls = createLanguageService({ operators: options.operators });
  registerTools(server, ls);

  return server;
}
