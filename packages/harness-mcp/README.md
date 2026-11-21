# @yumekit/harness-mcp

The MCP server of the harness. Any MCP client can be the brain.

## What this package owns

- The MCP tools of document 05 that map to project edits, media jobs, and renders.
- The server instructions that give an agent the order of work.
- The custom scene guide that `get_scene_guide` returns.

## Interface

```ts
function createHarnessServer(options: HarnessOptions): McpServer;

function createHarness(options: HarnessOptions): {
  tools: { name: string; description: string; inputSchema: JsonObject }[];
  call: (request: {
    name: string;
    input: JsonObject;
    onProgress?: (progress: HarnessProgress) => void;
  }) => Promise<HarnessResult>;
  close: () => Promise<void>;
};
```

`createHarness` gives the same tools as the MCP server, as functions. The engine of document 11 uses it. `createHarnessServer` is the MCP layer over the same tool table.

Each tool that changes the project calls `applyEdits` one time. No tool reads or writes an arbitrary file. A failure is a result with `isError: true` and `{ kind, message, hint }`. The hint says what to call or change next.

`yumekit mcp --project <folder>` in `apps/cli` serves this server over stdio.
