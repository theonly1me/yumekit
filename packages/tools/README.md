# @yumekit/tools

Connections to media MCP servers. Design: [06-media-tools.md](../../docs/design/06-media-tools.md).

## What this package owns

- The connections to the media tool servers that the user chooses.
- The media tool convention: tool names, inputs, and the result schema.
- The two `media-tools.json` files: `~/.config/yumekit/media-tools.json` and `<project>/media-tools.json`.
- The key file `~/.config/yumekit/keys.json` and its interface: `readKeyStates`, `saveKey`, and `removeKey`. No function returns a value of a key. Design: [10-providers-models-and-keys.md](../../docs/design/10-providers-models-and-keys.md).
- `YUMEKIT_CONFIG_DIRECTORY` replaces the folder `~/.config/yumekit`.

## Interface

`connectMediaTools({ projectFolder, bundledServers, toolTimeoutSeconds })` starts each configured server. It returns an `Outcome` with `MediaTools`, or the failure `invalid-configuration-file`:

- `list()` gives each server that started and its capabilities.
- `run(request)` checks each key of the description first, and returns `media-key-missing` without a call when one is missing. It then calls the tool for one capability and returns an `Outcome` with `{ server, result }` or a `MediaToolFailure`. `server` is the name of the server that it used, and `result` is the `MediaToolResult`.
- `list()` also gives the description of each server from `describe_media_server`, or `descriptionFailure`.
- `checkKey(server)` calls `check_key` of the server.
- `failedServers()` gives each server that did not start and the reason.
- `close()` stops each server.

With no `media-tools.json` file, only the bundled server named `sample` starts.

`findBundledServers()` gives the command of each bundled server in `tools/` that is built, by its name. `yumekit mcp`, `yumekit keys`, and the engine pass it as `bundledServers`.
