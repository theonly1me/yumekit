# @yumekit/cli

The `yumekit` command.

## Commands

| Command                                                                                     | What it does                                                                 |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `yumekit init <folder> [--name] [--frame-rate] [--output id:WIDTHxHEIGHT]...`               | Makes a project. The default is one 1920 by 1080 output named `wide`, 30 fps |
| `yumekit mcp --project <folder>`                                                            | Serves the harness MCP tools over stdio, with the bundled media servers      |
| `yumekit render --project <folder> --output <id> [--scale] [--first-frame] [--frame-count]` | Writes `renders/<id>.mp4`                                                    |
| `yumekit frame --project <folder> --output <id> --frame <n> [--scale]`                      | Writes `renders/<id>-frame-<n>.png`                                          |
| `yumekit keys`                                                                              | Lists each media server, each key it needs, and the state of the key         |
| `yumekit keys set <VARIABLE>`                                                               | Reads the value from a hidden prompt or from standard input, and saves it    |
| `yumekit keys remove <VARIABLE>`                                                            | Removes the key from the key file                                            |
| `yumekit open <folder> [--port <n>] [--no-browser]`                                         | Starts the engine with the built editor, prints the URL, and opens it        |

The value of a key is never a command argument, because a shell keeps arguments in its history. `yumekit keys set` writes `~/.config/yumekit/keys.json` with mode `0600`.

`yumekit mcp` writes only MCP messages to stdout. It prints each media server that failed to start to stderr.

If `yumekit open` runs for the project, `yumekit mcp` is a bridge. It reads `<project>/.yumekit/engine.json`, gets the tool list from the engine, and sends each tool call to the engine. The progress of a call comes back as MCP progress. The editor then shows each change of the agent. If no engine runs, `yumekit mcp` serves the harness itself.

`yumekit open` runs until you stop it with Ctrl+C. It then closes the engine and removes `engine.json`. If the editor is not built, the engine serves a page that says so. Run `pnpm build` to build the editor.

## Connect an agent

Build the repository first with `pnpm build`. Then add the server to the agent.

Claude Code:

```sh
claude mcp add yumekit -- node /path/to/yumekit/apps/cli/dist/main.js mcp --project /path/to/my-video
```

Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.yumekit]
command = "node"
args = ["/path/to/yumekit/apps/cli/dist/main.js", "mcp", "--project", "/path/to/my-video"]
startup_timeout_sec = 30
tool_timeout_sec = 900
```
