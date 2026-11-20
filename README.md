# yumekit

Open source harness for content creation.

yumekit turns an idea into editable content for YouTube, TikTok, Instagram, and more. One project makes long videos, shorts, and still images. You bring your own AI tools.

## Status

Early development. The repository has the package structure only. No feature works yet.

## How it works

- An agent CLI is the brain. yumekit supports `claude`, `codex`, and `cursor-agent`.
- Each media tool is an MCP server.
- A project is a folder of plain files. It works with git.
- The render is code (HyperFrames and FFmpeg), so each frame stays editable.
- The agent and the person change a project through the same edit operations.

## Package map

| Folder                 | What it owns                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `packages/project`     | The project folder format, the schema, validation, undo, and events.  |
| `packages/render`      | Frames and video files from scenes. Hides HyperFrames and FFmpeg.     |
| `packages/tools`       | Connections to media MCP servers, cost estimates, and the budget cap. |
| `packages/brain`       | Agent CLI detection, sessions, and the event stream.                  |
| `packages/harness-mcp` | The MCP tools that map to project edits and jobs.                     |
| `packages/engine`      | The engine process: the job queue, the editor server, and wiring.     |
| `packages/scene-kit`   | Scene components and style packs.                                     |
| `apps/editor`          | The React web editor.                                                 |
| `apps/cli`             | The `yumekit` command.                                                |
| `tools/`               | Bundled MCP tool servers, one folder for each.                        |

## Requirements

- Node.js 22 or later.
- pnpm. The version is pinned in `package.json`.

## Install and run the checks

1. Enable pnpm: `corepack enable pnpm`.
2. Install the dependencies: `pnpm install`.
3. Run the linter and the format check: `pnpm lint`.
4. Run the type check: `pnpm typecheck`.
5. Run the tests: `pnpm test`.
6. Build each package: `pnpm build`.

To format the files, run `pnpm format`.

## License

yumekit uses the Apache License 2.0. See `LICENSE`.
