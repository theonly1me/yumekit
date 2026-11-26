# Contributing to yumekit

Small and focused changes are easiest to review.

## Before you open a pull request

1. Open an issue for a large change. Describe the problem first.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`. All checks must pass. CI runs all of them except `pnpm test:e2e`.
3. Add a test for each behavior that you add or change.

## Design first

Read `docs/design/README.md` before a change. `AGENTS.md` has the full rules for code, tests, and pull requests.

## Code rules

- Use strict TypeScript. Do not use `any`, the non-null `!`, or `as` casts. `as const` is permitted.
- A function with two or more arguments takes one options object.
- Use full words for names.
- Keep each file under 200 lines, tests included.
- Do not write comments. Use clear names and tests.
- Do not disable a lint rule with `eslint-disable`.
- A package uses only the public interface of another package.

## Commit messages

Write one line in the format `type(scope): subject`. For example: `feat(project): add applyEdit`.

## Build yumekit from its source

You need Node.js 22 or later and pnpm. The version of pnpm is pinned in `package.json`.

1. Enable pnpm: `corepack enable pnpm`.
2. Install the dependencies: `pnpm install`.
3. Run the linter and the format check: `pnpm lint`.
4. Run the type check: `pnpm typecheck`.
5. Run the unit tests: `pnpm test`.
6. Run the end-to-end tests: `pnpm test:e2e`. They start yumekit, its media servers, Chromium, and FFmpeg, so they need FFmpeg and the browser of Playwright. `pnpm test:all` runs both sets.
7. Build each package: `pnpm build`.

To format the files, run `pnpm format`.

To make the npm package file, run `pnpm run pack-release`. Then run `pnpm run check-release`, which installs that file in a temporary folder and makes a short video with it. Document 14 in `docs/design` has the release steps.

## Package map

| Folder                 | What it owns                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `packages/project`     | The project folder format, the schema, validation, undo, and events.  |
| `packages/render`      | Frames and video files from scenes. Hides Chromium and FFmpeg.        |
| `packages/tools`       | Connections to media MCP servers, cost estimates, and the budget cap. |
| `packages/brain`       | Agent CLI detection, sessions, and the event stream.                  |
| `packages/harness-mcp` | The MCP tools that map to project edits and jobs.                     |
| `packages/engine`      | The engine process: the job queue, the editor server, and wiring.     |
| `packages/scene-kit`   | Scene components and style packs.                                     |
| `apps/editor`          | The React web editor.                                                 |
| `apps/cli`             | The `yumekit` command.                                                |
| `tools/`               | Bundled MCP tool servers, one folder for each.                        |

## License

By contributing, you agree that your contribution uses the Apache License 2.0.
