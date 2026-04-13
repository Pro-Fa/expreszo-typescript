# MCP Server

> **Audience:** Developers who want to give an AI assistant (Claude Desktop, Claude Code, Cursor, or any other MCP-capable client) the ability to inspect, complete, and diagnose ExpresZo expressions.

ExpresZo ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that wraps the [language service](language-service.md) and exposes it over stdio. Once it is wired into your MCP client, the model can ask the server for completions, hover information, syntax highlighting, and diagnostics for any ExpresZo expression — making it dramatically easier for an assistant to author or debug expressions without guessing at the supported functions and syntax.

## What it does

The MCP server registers four tools, each a thin wrapper around the matching language-service API:

| Tool | Purpose |
| --- | --- |
| `expreszo_get_completions` | Completion items (functions, constants, keywords, user variables) at a cursor position |
| `expreszo_get_hover` | Hover info — signature, documentation, and variable value preview at a position |
| `expreszo_get_highlighting` | Token-by-token syntax highlighting for an expression |
| `expreszo_get_diagnostics` | Parse errors and function-arity errors, returned as LSP `Diagnostic` objects |

All tools return the raw language-service payload as JSON, so the model sees the same data an IDE would consume.

## Installation

The server ships with `@pro-fa/expreszo` but its runtime dependencies (`@modelcontextprotocol/sdk` and `zod`) are declared as `optionalDependencies`, so they are only installed when npm is allowed to pull optionals (the default).

```bash
npm install @pro-fa/expreszo
```

If your environment disables optional dependencies (`npm install --no-optional` or equivalent), install them explicitly:

```bash
npm install @modelcontextprotocol/sdk zod
```

After install, the `expreszo-mcp` executable is available via `npx expreszo-mcp` or as a direct `bin` entry in `node_modules/.bin/`.

## Wiring it up

The server speaks MCP over **stdio**. Configure your client to spawn it as a subprocess.

### Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config) and add an entry under `mcpServers`:

```json
{
  "mcpServers": {
    "expreszo": {
      "command": "npx",
      "args": ["-y", "@pro-fa/expreszo", "expreszo-mcp"]
    }
  }
}
```

Restart Claude Desktop. The four `expreszo_*` tools will appear in the tool picker.

### Claude Code

Register the server with the `claude mcp` CLI:

```bash
claude mcp add expreszo -- npx -y @pro-fa/expreszo expreszo-mcp
```

Or add it manually to your MCP settings file:

```json
{
  "mcpServers": {
    "expreszo": {
      "command": "npx",
      "args": ["-y", "@pro-fa/expreszo", "expreszo-mcp"]
    }
  }
}
```

### VS Code (GitHub Copilot Chat agent mode)

VS Code 1.102+ supports MCP servers natively for Copilot Chat in agent mode. You can add the server in a few ways.

**Workspace-scoped (recommended — commit it alongside the repo):**

Create `.vscode/mcp.json` at the root of your workspace:

```json
{
  "servers": {
    "expreszo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@pro-fa/expreszo", "expreszo-mcp"]
    }
  }
}
```

VS Code will prompt you to trust the server the first time it starts. Anyone else who opens the workspace gets the same prompt.

**User-scoped (available in every workspace):**

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run **MCP: Add Server**. Pick **Command (stdio)**, enter:

- **Command**: `npx`
- **Args**: `-y @pro-fa/expreszo expreszo-mcp`
- **Name**: `expreszo`
- **Scope**: **User** (stores the entry in your user `settings.json`)

Once installed, open Copilot Chat, switch to **Agent** mode, and click the tools icon — the four `expreszo_*` tools appear under the `expreszo` server and can be toggled on/off per chat.

Use **MCP: List Servers** from the command palette to start, stop, restart, or view the output log of a running server.

### Cursor, Zed, and other MCP clients

Any MCP client that can spawn a stdio server will work. Use the same command (`npx -y @pro-fa/expreszo expreszo-mcp`) in whatever configuration format the client expects.

### Running from a local checkout

If you cloned the repo and want to run the built server directly:

```json
{
  "mcpServers": {
    "expreszo": {
      "command": "node",
      "args": ["/absolute/path/to/expreszo-typescript/dist/bin/mcp-server.mjs"]
    }
  }
}
```

Run `npm run build` once in the checkout to generate `dist/bin/mcp-server.mjs`.

## Using it from a chat

Once the server is wired up you don't call the tools directly — you ask the assistant a question in natural language and it decides which tools to invoke. The point of the MCP server is that the model can *look up* the real list of supported functions, constants, and arity rules instead of guessing.

### Example prompt

> I'm using ExpresZo to evaluate formulas entered by end users. Given the variables `price` (number), `discount` (number between 0 and 1), `taxRate` (number), and `isMember` (boolean), help me write an expression that computes the final total: apply the discount to the price, add tax on the discounted amount, and give members an extra 5% off the final total. Use the `expreszo` MCP server to check that every function you use actually exists and that the expression has no diagnostics before you give me the final answer.

With the server connected, a capable agent will typically:

1. Call `expreszo_get_completions` with a partial expression like `"if"` to discover that the conditional is spelled `if(cond, then, else)` (or that a ternary is available), rather than assuming a JavaScript-style `? :`.
2. Draft a candidate expression, for example:
   ```
   if(isMember, (price * (1 - discount)) * (1 + taxRate) * 0.95, (price * (1 - discount)) * (1 + taxRate))
   ```
3. Call `expreszo_get_diagnostics` on the draft. If anything comes back (wrong arity, unknown identifier, parse error), revise and re-check.
4. Optionally call `expreszo_get_hover` on individual identifiers like `if` to confirm the signature and documentation.
5. Return only the validated expression to you, along with a brief explanation.

### Other things you can ask

- *"What string functions does ExpresZo support? Use the MCP server to enumerate them."* — the agent calls `expreszo_get_completions` on an empty expression and filters the result.
- *"Here's an expression one of my users wrote: `sum(x, y` — what's wrong with it?"* — the agent calls `expreszo_get_diagnostics` and reports the parse error with position.
- *"Rewrite `a > 0 ? a : -a` as a valid ExpresZo expression."* — the agent discovers `abs` via completions/hover and returns `abs(a)`.

The general pattern: **ask for help with an expression, and explicitly mention "use the expreszo MCP server to verify"** so the agent commits to checking its answer instead of hallucinating function names.

## Tool reference

All tools take a required `expression` (the ExpresZo source text) and an optional `uri` (used purely to label the virtual document — defaults to `expreszo://inline`).

Tools that need a cursor position accept either an **offset** (0-based index into the expression string, friendliest for single-line expressions) or an **LSP `{ line, character }` pair** (both 0-based).

### `expreszo_get_completions`

Returns an array of LSP `CompletionItem` objects.

```json
{
  "expression": "sin(x) + p",
  "position": { "offset": 10 },
  "variables": { "x": 45 }
}
```

- `position` — `{ offset }` or `{ line, character }`. Required.
- `variables` — optional map of variable names to runtime values. When supplied, completions include the variable names and their type.

### `expreszo_get_hover`

Returns a single LSP `Hover` object (with `contents.value` as markdown).

```json
{
  "expression": "sin(x)",
  "position": { "offset": 1 }
}
```

- `position` and `variables` have the same shape as `expreszo_get_completions`.

### `expreszo_get_highlighting`

Returns an array of highlight tokens: `{ type, start, end, value? }` where `type` is one of `number`, `string`, `name`, `keyword`, `operator`, `function`, `punctuation`, `constant`.

```json
{
  "expression": "1 + sin(x) * 2"
}
```

### `expreszo_get_diagnostics`

Returns an array of LSP `Diagnostic` objects. An empty array means the expression parses cleanly and all function calls have valid arity.

```json
{
  "expression": "pow(2)"
}
```

produces a diagnostic explaining that `pow` requires two arguments.

## Programmatic use

If you want to embed the MCP server inside a larger Node application (for example, a custom transport or a test harness), import `createMcpServer` from the `mcp-server` subpath export:

```ts
import { createMcpServer } from '@pro-fa/expreszo/mcp-server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createMcpServer({
  // Optional: limit which operators the language service exposes
  operators: { conditional: true, 'in': false }
});

await server.connect(new StdioServerTransport());
```

`createMcpServer` accepts the same `operators` filter as `createLanguageService`, plus optional `name` and `version` strings for the MCP `serverInfo`.

## Local development and debugging

From a clone of the repo:

```bash
# Run the server against the source (no build needed)
npm run mcp:dev

# Open the official MCP Inspector — lists all 4 tools and lets you
# invoke them interactively with JSON input
npm run mcp:inspect
```

To smoke-test manually against the built artifact, pipe JSON-RPC directly into the binary:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0.0.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | node dist/bin/mcp-server.mjs
```

You should see the server respond with its `serverInfo` followed by the list of four `expreszo_*` tools.
