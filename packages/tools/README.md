# @yumekit/tools

Connections to media MCP servers. Design: [06-media-tools.md](../../docs/design/06-media-tools.md).

## What this package owns

- The connections to the media tool servers that the user chooses.
- The media tool convention: tool names, inputs, and the result schema.
- The two `media-tools.json` files: `~/.config/yumekit/media-tools.json` and `<project>/media-tools.json`.

## Interface

`connectMediaTools({ projectFolder, bundledServers })` starts each configured server and returns `MediaTools`:

- `list()` gives each server that started and its capabilities.
- `run(request)` calls the tool for one capability and returns an `Outcome` with a `MediaToolResult` or a `MediaToolFailure`.
- `close()` stops each server.

With no `media-tools.json` file, only the bundled server named `sample` starts.
