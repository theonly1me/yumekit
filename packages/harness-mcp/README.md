# @yumekit/harness-mcp

The MCP server of the harness.

## What this package owns

- The MCP tools that map to project edits and jobs.

## Interface

The planned interface is: one MCP server.

No tool exposes a file write. Each tool sends an edit through `applyEdit`.

The package is a scaffold. It has no feature logic yet.
