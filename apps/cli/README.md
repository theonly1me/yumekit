# @yumekit/cli

The `yumekit` command.

## Commands

| Command                                                                                     | What it does                                                                 |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `yumekit init <folder> [--name] [--frame-rate] [--output id:WIDTHxHEIGHT]...`               | Makes a project. The default is one 1920 by 1080 output named `wide`, 30 fps |
| `yumekit mcp --project <folder>`                                                            | Serves the harness MCP tools over stdio, with the bundled media servers      |
| `yumekit render --project <folder> --output <id> [--scale] [--first-frame] [--frame-count]` | Writes `renders/<id>.mp4`                                                    |
| `yumekit frame --project <folder> --output <id> --frame <n> [--scale]`                      | Writes `renders/<id>-frame-<n>.png`                                          |

`yumekit mcp` writes only MCP messages to stdout. It prints each media server that failed to start to stderr.

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
