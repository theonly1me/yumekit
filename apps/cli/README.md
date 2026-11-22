# @yumekit/cli

The `yumekit` command.

## Commands

| Command                                                                                     | What it does                                                                                                                                              |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yumekit [--port <n>] [--no-browser]`                                                       | Starts the start screen, prints the URL, and opens it                                                                                                     |
| `yumekit init <folder> [--name] [--frame-rate] [--output id:WIDTHxHEIGHT]...`               | Makes a project. The default is one 1920 by 1080 output named `wide`, 30 fps                                                                              |
| `yumekit mcp --project <folder>`                                                            | Serves the harness MCP tools over stdio, with the bundled media servers                                                                                   |
| `yumekit render --project <folder> --output <id> [--scale] [--first-frame] [--frame-count]` | Writes `renders/<project name>-<platform id>.mp4` for each platform of the output, or `renders/<id>.mp4` for an output with no platform. Prints each file |
| `yumekit frame --project <folder> --output <id> --frame <n> [--scale]`                      | Writes `renders/<id>-frame-<n>.png`                                                                                                                       |
| `yumekit keys`                                                                              | Lists each media server, each key it needs, and the state of the key                                                                                      |
| `yumekit keys set <VARIABLE>`                                                               | Reads the value from a hidden prompt or from standard input, and saves it                                                                                 |
| `yumekit keys remove <VARIABLE>`                                                            | Removes the key from the key file                                                                                                                         |
| `yumekit open <folder> [--port <n>] [--no-browser]`                                         | Starts the engine with the built editor, prints the URL, and opens it                                                                                     |
| `yumekit agent connect --agent claude-code\|codex\|cursor [--project <folder>]`             | Writes the yumekit MCP entry for the agent in the project folder                                                                                          |
| `yumekit doctor`                                                                            | Checks Node.js, FFmpeg, Chromium for Playwright, and the agent programs                                                                                   |
| `yumekit setup`                                                                             | Installs Chromium with the Playwright version of yumekit                                                                                                  |

The value of a key is never a command argument, because a shell keeps arguments in its history. `yumekit keys set` writes `~/.config/yumekit/keys.json` with mode `0600`.

`yumekit mcp` writes only MCP messages to stdout. It prints each media server that failed to start to stderr.

If `yumekit open` runs for the project, `yumekit mcp` is a bridge. It reads `<project>/.yumekit/engine.json`, gets the tool list from the engine, and sends each tool call to the engine. The progress of a call comes back as MCP progress. The editor then shows each change of the agent. If no engine runs, `yumekit mcp` serves the harness itself.

`yumekit` with no command starts the home server. Its start screen makes a project in the projects folder (`~/Documents/yumekit`, or `projectsFolder` in `~/.config/yumekit/settings.json`), starts an engine for it, and sends the first request to the AI. It also lists the recent projects from `~/.config/yumekit/recent.json`. It runs until you stop it with Ctrl+C, and then it stops each engine that it started.

`yumekit open` runs until you stop it with Ctrl+C. It then closes the engine and removes `engine.json`. If the editor is not built, the engine serves a page that says so. In the repository, run `pnpm build` to build the editor.

`yumekit doctor` prints one line for each need. Each line starts with `ok`, `missing`, or `none`, and a `missing` line says what to do. The command exits with 1 when Node.js, FFmpeg, or Chromium is missing. No agent program is not a failure.

`yumekit setup` runs the browser install of the Playwright package in yumekit, for Chromium only, and prints its progress. A render that cannot start the browser says to run `yumekit setup`.

Each command stops with one sentence on Node.js older than 22.

## Connect an agent

`yumekit agent connect` writes the entry for Claude Code, Codex, or Cursor. The entry names the Node.js program and the full path of the installed `main.js`. If you start yumekit with `npx`, that path is in the npx cache, and the entry stops working when the cache is cleared. Install yumekit with `npm install -g yumekit` for an entry that stays.

To add the server by hand, use the `npx` form.

Claude Code:

```sh
claude mcp add yumekit -- npx -y yumekit mcp --project /path/to/my-video
```

Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.yumekit]
command = "npx"
args = ["-y", "yumekit", "mcp", "--project", "/path/to/my-video"]
startup_timeout_sec = 30
tool_timeout_sec = 900
```
