# yumekit

Open source harness for content creation.

yumekit turns an idea into editable content for YouTube, TikTok, Instagram, and more. One project makes long videos, shorts, and still images. You bring your own AI tools.

## What it does

You type what you want. The AI program that you already have (Claude Code, Codex, or Cursor) writes the script, makes the scenes, records a voice, and puts the video together. You watch each step, and you can change each part.

- **One video for each platform.** YouTube, YouTube Shorts, TikTok, Instagram Reel, Instagram post, X, LinkedIn, and square, each in its own shape.
- **Scenes drawn by code.** 26 scene types and 5 looks, with motion and transitions. The text is exact, a change costs nothing, and the result is the same each time.
- **Real video clips when you want them.** A scene can become a clip from a video model, with a camera move and a first and a last picture. You pick "Graphics", "AI video", or "Mix" for a video.
- **A voice with no key.** yumekit has a natural voice that runs on your computer, after one download of 148 MB.
- **Pictures with no key.** If Codex is on your computer and signed in with ChatGPT, yumekit makes pictures with your plan, also from a reference picture.
- **Any model that you have a key for.** Pictures, voice, music, video clips, sound effects, talking clips, and a sharper copy, from OpenAI, Google Gemini, and fal. You pick the service and the model for each kind.
- **Your own files.** Bring a picture, a sound, or a video, and save each file that yumekit makes.
- **An editor that a person can use.** Change a text in the video with a click, change the script, the pictures, the voice, and the music, and undo each change.
- **Everything stays on your computer.** A project is a folder of plain files. yumekit has no server and no account.

## Get started

You need Node.js 22 or later, and FFmpeg. If FFmpeg is missing, `yumekit doctor` gives the command that installs it on your system.

```sh
npm install -g yumekit
yumekit setup
yumekit
```

1. `npm install -g yumekit` installs yumekit.
2. `yumekit setup` downloads the browser that draws your videos. It runs one time.
3. `yumekit` opens the start screen in your browser. Type what you want to make, and click "Make the video".

yumekit asks the AI program on your computer (Claude Code, Codex, or Cursor) to make the video, so one of them must be installed and signed in. Your projects are folders in `~/Documents/yumekit`.

If something does not work, run `yumekit doctor`. It checks Node.js, FFmpeg, the browser, and the agent programs, and each line that is not "ok" says what to do.

## Or let your agent do it

Paste this into Claude Code, Codex, Cursor, or another coding agent:

```text
Read https://github.com/theonly1me/yumekit/blob/main/skills/yumekit/SKILL.md and set up yumekit on this computer. Then start it for me.
```

The file tells the agent how to install yumekit, how to check the computer, and how to make a video with the yumekit tools. In a clone of this repository, the same file is `skills/yumekit/SKILL.md`.

## What you do after the first video

- Open each step to check it: the script, the pictures, the voice, and the music.
- Open the editor to change a text with a click, to change a scene, and to ask the AI for a change.
- Click "Export" for one file for each platform.

## Keys

yumekit needs no key for the AI: it uses the sign-in of your agent program. It needs no key for a voice. With Codex signed in with ChatGPT, it needs no key for pictures either: each picture uses your ChatGPT plan. Any other media service needs its own key, which you add in Settings of the editor or with `yumekit keys set <VARIABLE>`. yumekit keeps a key on your computer and sends it only to its own service. A model that nobody has run with yumekit yet shows "Not tested with yumekit yet".

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

## Design and code

The design is in `docs/design`: read `docs/design/README.md` first. To build yumekit from its source and to change it, read `CONTRIBUTING.md`.

## License

yumekit uses the Apache License 2.0. See `LICENSE`.
