import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server/server';

interface ToolResult {
  isError?: boolean;
  content: Array<{ type: string; text: string }>;
}

async function callTool(
  server: ReturnType<typeof createMcpServer>,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // `_registeredTools` is a private field on McpServer but is the only
  // in-process way to invoke a registered tool handler without wiring a
  // full transport. Good enough for a smoke test.
  const registry = (server as unknown as {
    _registeredTools: Record<
      string,
      { handler: (args: Record<string, unknown>, extra: unknown) => Promise<ToolResult> }
    >;
  })._registeredTools;

  const tool = registry[name];
  if (!tool) {
    throw new Error(`Tool not registered: ${name}`);
  }
  return tool.handler(args, {});
}

function parsePayload(result: ToolResult): unknown {
  expect(result.isError).toBeFalsy();
  expect(result.content[0]?.type).toBe('text');
  return JSON.parse(result.content[0]!.text);
}

describe('MCP server', () => {
  it('registers all expreszo tools', () => {
    const server = createMcpServer();
    const registry = (server as unknown as { _registeredTools: Record<string, unknown> })
      ._registeredTools;
    const names = Object.keys(registry).sort();
    expect(names).toEqual([
      'expreszo_get_completions',
      'expreszo_get_definition',
      'expreszo_get_diagnostics',
      'expreszo_get_document_symbols',
      'expreszo_get_folding_ranges',
      'expreszo_get_highlighting',
      'expreszo_get_hover',
      'expreszo_get_references',
      'expreszo_get_semantic_tokens',
      'expreszo_get_signature_help'
    ]);
  });

  it('expreszo_get_completions returns items filtered by prefix with offset position', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_completions', {
      expression: 'ma',
      position: { offset: 2 },
      variables: { max: 10, min: 5 }
    });
    const payload = parsePayload(result) as Array<{ label: string }>;
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.some((c) => c.label === 'max')).toBe(true);
    expect(payload.every((c) => c.label.toLowerCase().startsWith('ma'))).toBe(true);
  });

  it('expreszo_get_completions accepts line/character position', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_completions', {
      expression: 'foo',
      position: { line: 0, character: 3 },
      variables: { foo: 123 }
    });
    const payload = parsePayload(result) as Array<{ label: string }>;
    expect(payload.some((c) => c.label === 'foo')).toBe(true);
  });

  it('expreszo_get_hover returns a hover object for a known function', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_hover', {
      expression: 'sin(1)',
      position: { offset: 1 }
    });
    const payload = parsePayload(result) as { contents?: { value?: string } } | null;
    expect(payload).toBeTruthy();
    expect(typeof payload?.contents?.value).toBe('string');
  });

  it('expreszo_get_highlighting returns an array of tokens', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_highlighting', {
      expression: '1 + sin(x)'
    });
    const payload = parsePayload(result) as Array<{ type: string; start: number; end: number }>;
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBeGreaterThan(0);
    expect(payload.some((t) => t.type === 'number')).toBe(true);
    expect(payload.some((t) => t.type === 'operator')).toBe(true);
  });

  it('expreszo_get_diagnostics returns an empty array for a valid expression', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_diagnostics', {
      expression: '1 + 2'
    });
    const payload = parsePayload(result) as unknown[];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBe(0);
  });

  it('expreszo_get_diagnostics reports errors for a malformed expression', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'expreszo_get_diagnostics', {
      expression: '1 + '
    });
    const payload = parsePayload(result) as unknown[];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBeGreaterThan(0);
  });
});
