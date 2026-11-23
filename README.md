# yumekit

Open source harness for content creation.

yumekit turns an idea into editable content for YouTube, TikTok, Instagram, and more. One project makes long videos, shorts, and still images. You bring your own AI tools.

## What it does

You type what you want. The AI program that you already have (Claude Code, Codex, or Cursor) writes the script, makes the scenes, records a voice, and puts the video together. You watch each step, and you can change each part.

- **One video for each platform.** YouTube, YouTube Shorts, TikTok, Instagram Reel, Instagram post, X, LinkedIn, and square, each in its own shape.
- **Scenes drawn by code.** 19 scene types and 5 looks, with motion and transitions. The text is exact, a change costs nothing, and the result is the same each time.
- **Real video clips when you want them.** A scene can become a clip from a video model, with a camera move and a first and a last picture. You pick "Graphics", "AI video", or "Mix" for a video.
- **A voice with no key.** yumekit has a natural voice that runs on your computer, after one download of 148 MB.
- **Any model that you have a key for.** Pictures, voice, music, video clips, sound effects, talking clips, and a sharper copy, from OpenAI, Google Gemini, and fal. You pick the service and the model for each kind.
- **Your own files.** Bring a picture, a sound, or a video, and save each file that yumekit makes.
- **An editor that a person can use.** Change a text in the video with a click, change the script, the pictures, the voice, and the music, and undo each change.
- **Everything stays on your computer.** A project is a folder of plain files. yumekit has no server and no account.

## Install

yumekit needs Node.js 22 or later, and FFmpeg.

```sh
npm install -g yumekit
yumekit doctor
```

`yumekit doctor` checks FFmpeg, the browser of the renderer, and the agent programs. Each line that is not "ok" says what to do. To get the browser, run `yumekit setup`.

## First video

1. Run `yumekit`. It prints the URL of the start screen and opens it in the browser.
2. Type what you want to make. If you want, pick a format, the platforms, the look, and how long it is.
3. Click "Make the video". yumekit makes the project in `~/Documents/yumekit` and asks the AI program on your computer to make it. With "Show me the plan first", the AI stops after the script and the pictures, and you click "Continue".
4. Open each step to check it, then open the editor. Change what you want, then click "Export".

The start screen lists your recent projects. To open a project folder directly, run `yumekit open <folder>`.

## Keys

yumekit needs no key for the AI: it uses the sign-in of your agent program. A media service needs its own key, which you add in Settings of the editor or with `yumekit keys set <VARIABLE>`. yumekit keeps a key on your computer and sends it only to its own service. A model that nobody has run with yumekit yet shows "Not tested with yumekit yet".

## Use an agent

Connect Claude Code, Codex, or Cursor to the project:

```sh
yumekit agent connect --agent claude-code --project my-video
```

Any other MCP client can start the yumekit MCP server with `npx`:

```sh
npx -y yumekit mcp --project /path/to/my-video
```

## How it works

- Any MCP client is the brain, for example Claude Code, Codex, Cursor, or Grok.
- Each media tool is an MCP server.
- A project is a folder of plain files. It works with git.
- The render is code on our own open stack (headless Chromium and FFmpeg), so each frame stays editable.
- The agent and the person change a project through the same edit operations.

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

## Design

Read `docs/design/README.md` first. Agents also read `AGENTS.md`.

## Work on yumekit

You need Node.js 22 or later and pnpm. The version of pnpm is pinned in `package.json`.

1. Enable pnpm: `corepack enable pnpm`.
2. Install the dependencies: `pnpm install`.
3. Run the linter and the format check: `pnpm lint`.
4. Run the type check: `pnpm typecheck`.
5. Run the tests: `pnpm test`.
6. Build each package: `pnpm build`.

To format the files, run `pnpm format`.

To make the npm package file, run `pnpm run pack-release`. Then run `pnpm run check-release`, which installs that file in a temporary folder and makes a short video with it. Document 14 in `docs/design` has the release steps.

## License

yumekit uses the Apache License 2.0. See `LICENSE`.
