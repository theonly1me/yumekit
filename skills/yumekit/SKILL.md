---
name: yumekit
description: Set up yumekit on this computer and make a video with it. Use when a person asks to install yumekit, to make or change a video with yumekit, or to connect an agent to a yumekit project.
---

# yumekit

yumekit makes short videos on the computer of the person. It has no server and no account. This file tells an agent how to set it up and how to make a video with it.

## Rules

- Never ask the person to paste a key or a token into the chat. A key goes in through `yumekit keys set <VARIABLE>`, which reads it from a hidden prompt that the person types into.
- Never export a video unless the person asks. An export takes minutes.
- Never pick a paid model unless the person asks for it or the project has the style `ai-video` or `mix`.
- Tell the person each command that you run, in one plain sentence.

## Set up

1. Check Node.js: `node --version` must be 22 or later. If it is older or missing, tell the person to install Node.js 22 from https://nodejs.org, and stop.
2. Install yumekit: `npm install -g yumekit`.
3. Check the computer: `yumekit doctor`. It prints one line for each need, with "ok" or what to do.
4. If the line for the browser is not "ok", run `yumekit setup`. It downloads the browser that draws the video.
5. If the line for FFmpeg is not "ok", run the install command that `yumekit doctor` printed for this system.
6. Run `yumekit doctor` again. Continue when it exits with 0.

## The easy way: the person uses the screen

1. Run `yumekit`. It prints an address and opens the start screen in the browser. It runs until the person stops it, so start it in the background or in its own terminal.
2. Tell the person to type the idea on the start screen and to click "Make the video". yumekit then asks the AI program of the person (Claude Code, Codex, or Cursor) to make the video.
3. The projects are folders in `~/Documents/yumekit`.

## The agent way: you make the video with the yumekit tools

1. Make a project folder: `yumekit init <folder> --name "<name>"`.
2. Connect your agent program to it: `yumekit agent connect --agent claude-code --project <folder>`. Use `codex` or `cursor` for those programs. For another MCP client, the server command is `npx -y yumekit mcp --project <folder>`.
3. Start a new session of the agent program in that folder, so it loads the yumekit tools.
4. Follow the instructions that the yumekit server gives with its tools. The usual order:
   1. `get_project` first.
   2. `set_script` with one line for each scene.
   3. `list_kit_scenes`, then `put_scene` for each scene. Prefer a kit scene. Before custom scene code, read `get_scene_guide`.
   4. `preview_scenes` to look at each scene during its entry and after it settled.
   5. `generate_asset` for a voice, then `place_narration`.
   6. `set_timeline`, then `set_transitions` once for the whole video.
   7. For a later change, use the smallest tool: `replace_narration` records the voice again, `replace_music` changes the music. Write the whole timeline only for a new video.
5. To let the person watch and change the video, run `yumekit open <folder>`.
6. Export only on request: the person clicks "Export" in the editor, or you call `render_video`.

## Story first

For a story film (a trailer, a short, an anime), write the story before any shot. A run once made a trailer from a list of 14 shots with no story behind them. The words on screen were generic ("the night is not empty"), the hero won each fight on screen, and two fights and the final encounter came one right after the other. The person rejected it: a trailer shows moments of a longer story, and it was the whole film pressed into 34 seconds.

1. Read `get_story_guide`.
2. Write the whole story with `set_story`: the premise in one sentence, the world and its rule, each main character (background, want, fear, and what they do not know), the opposing force and why it acts, the arc in 3 to 6 steps, and what stays unknown.
3. Show the story to the person in plain words, and ask for a yes or changes. The question is free, and a wrong story wastes every paid shot after it. Skip it only when the person said to go ahead without asking.
4. Write the plan with `set_story_plan`, with its `form` and the `story_fact` of each shot. A trailer raises a question and never shows how a conflict ends.
5. Put a `trailer-card` between the moments of a trailer, with its `storyFact`, on a hit that `check_music` measured, and end on a `trailer-card` with `variant: "title"`.
6. Test each line on screen: it is good when it could belong to this story only.

An example. The story: in a village where a bell under the frozen lake rings once before each death, a girl who hears it ring for her grandfather goes under the ice to silence it; the keeper of the bell rings it so that nobody dies without a goodbye. The trailer: the girl and her grandfather pull a net from the ice (the world as it was); the card "Every winter, the lake keeps one sound"; frost spreads from under her boot (the break); the card "Tonight it rang for him"; she takes the ice saw from the wall (the stakes); three short moments under the ice (the rise); the title on the biggest hit. It never shows the face of the keeper or how the story ends.

## Keys

- The AI needs no key. yumekit uses the sign-in of the agent program.
- A voice needs no key. yumekit has a natural voice that runs on the computer after one download of 148 MB.
- Music, pictures from a model, and video clips need the key of a service: `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `FAL_KEY`. `yumekit keys` lists each service with the state of its key. The person adds a key in Settings of the editor, or with `yumekit keys set <VARIABLE>`.

## When something fails

- Each failure of a tool has a `kind`, a message, and often a hint. Read the hint first.
- `browser-not-installed`: run `yumekit setup`.
- `would-remove-the-work-of-the-person`: the call would remove a file, a clip, or a transition that the person made. Keep each thing that the failure lists. Give `remove_person_work: true` only when the person asked for that removal.
- `media-key-missing`: say which key is missing and that the person can add it in Settings. Then make the rest of the video.
- For anything else, run `yumekit doctor` and report its lines to the person.
