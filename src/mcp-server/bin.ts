import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  const shutdown = async (): Promise<void> => {
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[expreszo-mcp] fatal:', err);
  process.exit(1);
});
