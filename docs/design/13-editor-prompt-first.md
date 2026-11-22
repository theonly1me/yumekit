# 13. The editor, second version: the prompt comes first

The owner used the first version of the editor (document 11) on 2026-11-21 and rejected its use. The person could not type a request, could not change anything in the timeline, could not find "Make a clip", and had only the outputs Wide and Tall. The owner approved a new direction on 2026-11-22. The package `apps/prototype` shows it, and the editor follows that prototype for the layout, the words, and the look.

This document replaces the section "Screens of the first version" of document 11. The engine, the preview, the token, and the events of document 11 stay.

## Decisions

| Id  | Decision                                                                                   | Why                                                                       |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| P1  | The prompt is the main control. The chat is always visible on the right                    | The owner asked where the prompt goes                                     |
| P2  | A person changes each simple thing directly, and asks the AI for the rest                  | The owner asked if a human can edit                                       |
| P3  | A direct change uses a harness tool, the same one that the AI uses                         | One set of rules and one undo history (decision E3)                       |
| P4  | Scenes show as cards. The track view is behind the switch "Detailed timeline"              | Tracks are a tool for an expert                                           |
| P5  | The person picks platforms. Platforms with the same size share one output                  | One render for TikTok, Reels, and Shorts                                  |
| P6  | A direct change applies to each output that holds the clip                                 | One video in several shapes stays one video                               |
| P7  | Keys and tools are in Settings. A step shows a key guide only when it needs the key        | A person who makes a first video needs no key screen                      |
| P8  | The AI does not stop for approval before the first video. It asks before a paid video clip | The prototype has no stop. A video clip is the high cost                  |
| P9  | `yumekit` with no arguments opens the start screen                                         | A person does not make a project folder by hand                           |
| P10 | The interface uses the words of the prototype: Export, scene, voice, music, captions       | The words MCP, frame, track, render, asset, and props are for a developer |

## Platforms

A platform is a place where the person publishes. The catalog is a fixed list in `@yumekit/project`.

| Id               | Name           | Shape | Size        | Output id  |
| ---------------- | -------------- | ----- | ----------- | ---------- |
| `youtube`        | YouTube        | 16:9  | 1920 x 1080 | `wide`     |
| `youtube-shorts` | YouTube Shorts | 9:16  | 1080 x 1920 | `tall`     |
| `tiktok`         | TikTok         | 9:16  | 1080 x 1920 | `tall`     |
| `instagram-reel` | Instagram Reel | 9:16  | 1080 x 1920 | `tall`     |
| `instagram-post` | Instagram post | 4:5   | 1080 x 1350 | `portrait` |
| `x`              | X              | 16:9  | 1920 x 1080 | `wide`     |
| `linkedin`       | LinkedIn       | 16:9  | 1920 x 1080 | `wide`     |
| `square`         | Square         | 1:1   | 1080 x 1080 | `square`   |

- An output gets the optional field `platforms`, a list of catalog ids. The format version stays 1, because a project without the field stays valid.
- A custom size is an output with no platform. Its id is `custom-<width>x<height>`.
- The tool `add_platform` takes `platform_id`. If the output of that size exists, the tool adds the id to its `platforms`. If it does not exist, the tool adds the output and copies the timeline of the output with the nearest ratio of the sides. The call is one undo step.
- The tool `remove_platform` takes `platform_id`. It removes the id. It removes the output when no platform is left and the project has another output. The call is one undo step.
- `add_output` and `remove_output` stay for a custom size.
- `render_video` writes one file for each platform of the output: `renders/<project name>-<platform id>.mp4`. It renders once. Each later file is a hard link to the first, or a copy when a link fails. An output with no platform keeps its file name of today.
- The editor shows one tab for each platform, in catalog order, then one tab for each custom output. Two tabs of one output show the same preview.

### Details of platforms

WP27 made these choices where the section "Platforms" gives no rule.

- The store has the edit `setOutputPlatforms` (`outputId`, `platforms`). `add_platform` and `remove_platform` each send one batch of edits to `applyEdits`, so each call is one undo step.
- The store checks that a platform is on one output only, and that the output has the size of the platform.
- "The output of that size" is the first output, in project order, with the same width and height. It can be a custom output, such as `wide` of `yumekit init`.
- A new output takes the output id of the catalog and a label for its shape, for example `square` and "Square 1:1".
- The nearest output has the smallest difference between its ratio of width to height and the ratio of the platform. On a tie, the first output in project order wins. With no output, the new output has an empty timeline.
- `add_platform` for a platform that an output has changes nothing and succeeds.
- When `remove_platform` removes the last platform of the only output, the output stays as a custom output.
- `render_video` renders to the file of the first platform in catalog order. The result keeps `file` (that first file) and adds `files`, with `platform_id` and `file` for each file.
- The project name in a file name is in lower case. Each run of characters that are not a letter or a digit becomes one hyphen. It has at most 64 characters and no hyphen at either end. An empty result becomes `video`.
- `yumekit init` keeps its output `wide` with no platform. `yumekit render` keeps the file `renders/<output id>.mp4`.

## Direct changes to scenes

The scenes row is the first scene track that is not a caption track, as in document 11. These tools change it. Each one is one undo step, and each one is also for the AI.

| Tool                   | Input                        | What it does                                                            |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `resize_scene_clip`    | `clip_id`, `duration_frames` | Sets the length. Each later clip of the track moves by the difference   |
| `move_scene_clip`      | `clip_id`, `to_index`        | Puts the clip at another place in the row. The clips keep their lengths |
| `remove_scene_clip`    | `clip_id`                    | Removes the clip. Each later clip of the track moves earlier            |
| `duplicate_scene_clip` | `clip_id`                    | Copies the scene and puts a clip of the copy after the clip             |

- Each tool takes the optional `output_ids`. With no value, the tool changes each output that has a clip with that id on its scenes row (decision P6).
- The tools move only the clips of the scenes row. A voice clip, a music clip, a video sound clip, and the captions keep their places.
- So a change can leave the voice out of step with the scenes. When an output has a voice clip, the result of the tool has `voice_may_not_match: true`. The editor then shows "The voice may not match the scenes now." with the button "Ask the AI to fit the voice", which sends that request to the chat.
- A track gets the optional field `off`. The preview and the renderer skip a track that is off. The tool `set_track_off` takes `output_ids` (optional, as above), `track_id`, and `off`.

### Details of direct changes

These rules came from the build of WP28.

1. Each tool sends one `setTimeline` edit for each changed output, and `duplicate_scene_clip` also sends one `putScene` edit for each copy. All edits go in one `applyEdits` call, so one call is one undo step. The 15 edit kinds of document 03 stay.
2. The rule for the scenes row has one copy: `scenesRowOf` and `isCaptionTrack` in `@yumekit/project`. The entry `@yumekit/project/scenes-row` gives the same functions with no Node code. The editor imports only that entry, so the dependency table of document 01 permits it. The editor build then needs the `dist` folder of `@yumekit/project`. CI makes it with `tsc --build` in `pnpm typecheck`, before `pnpm test`.
3. The order of the row is the start order of its clips. A later clip is a clip after the changed clip in that order.
4. `resize_scene_clip` keeps each gap of the row, because each later clip moves by the same difference.
5. `move_scene_clip` places the clips end to end from the start frame of the first clip before the move. So each gap of the row closes. A `to_index` equal to the current index changes nothing and records no undo step.
6. `remove_scene_clip` moves each later clip earlier by the length of the removed clip. Other gaps stay. The scene stays in the project, also when no clip shows it. The sound clip of a removed `video-clip` scene stays on `video-sound`, as each sound clip keeps its place.
7. `duplicate_scene_clip` names the copy `<scene id>-copy`, with a suffix such as `-2` when that id is taken. Its title is `<title> (copy)`. It keeps the notes and the props, and the code of a module scene. The new clip is `<clip id>-copy`, with the same rule for a suffix, and has the same id in each changed output. When two outputs show different scenes for the clip id, each scene gets its own copy.
8. The tools check `duration_frames` and `to_index` themselves, so a wrong value gets a failure with a `kind`: `invalid-duration` or `index-out-of-range`. Other failures are `clip-not-found`, `clip-not-on-scenes-row`, `output-not-found`, and `track-not-found`. With `output_ids`, each named output must hold the clip on its scenes row. If one does not, the tool changes nothing.
9. A result has `output_ids`, `scenes_rows` (the clips of the row of each changed output), `voice_may_not_match`, and `revision`. `voice_may_not_match` is always present, as `true` or `false`. A voice clip is an audio clip of an asset with word timings, also on a track that is off. `duplicate_scene_clip` also gives `clip_id` and `scene_ids`.
10. The store keeps `off` only as `off: true`. `set_track_off` with `off: false` removes the field, so a project that never switches a track off keeps its files. `get_timeline` shows `off` on each track, as `false` when the field is absent. `set_timeline` accepts `off`.
11. The renderer drops each track that is off when it loads an output. So `render_video`, `render_still`, `preview_frame`, and the preview page skip its pictures and its sound. The length of the output still counts each track. The sound of the editor preview skips each audio track that is off.

## The screens

The prototype is the reference for each screen. This list gives the behavior behind it.

| Screen   | Behavior                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start    | The prompt, the platforms, the length, "Make the video", the AI line with "Change", and the recent projects                                           |
| Making   | The editor while the first request runs and the project has no scene: plain steps and the scene cards as they appear, and "Stop"                      |
| Editor   | Platform tabs, the preview, Play, the scene cards, the rows Voice, Music, and Captions, the switch "Detailed timeline", and the side panel            |
| Chat     | The requests, the answers, each change with "Undo", the suggestions, and the prompt box with the scene chip. Document 12 has the interface            |
| Scene    | The form of document 11 for the picked scene, with the length and the name of the scene. It is a tab next to Chat                                     |
| Clip     | "Make a real video clip" for the picked scene: the prompt from the scene, the models with a price, the length, and the key guide in place when needed |
| Export   | One row for each platform with a check box, the file name, the progress, and "Show the file"                                                          |
| Settings | AI (which agent program), Media tools and keys (the Tools pane of document 11), and Limits                                                            |

#### The editor

1. A picked card shows its actions: "Edit text", the length with minus and plus, "Make a real video clip", "Duplicate", and "Delete". Minus and plus change the length by one second, with a minimum of one second.
2. A card moves by drag, and also by the keys Left and Right with Alt on a picked card. Each move calls `move_scene_clip`.
3. The "+" between two cards opens one line: "Describe the new scene". The editor sends it to the chat as a request that names the two neighbor scenes.
4. "Edit text" opens the Scene tab and puts the cursor in the first text field.
5. A click on a text in the preview changes it in place (work package WP33). Before WP33, the click opens the Scene tab, as "Edit text" does.
6. A sound row shows when its track exists. The voice row is the track with the voice clips. The captions row is the caption track. The music row is each other audio track, except `video-sound`. The switch calls `set_track_off`. "Change" puts a start of a request in the prompt box, for example "Change the voice to ", and moves the cursor there.
7. The detailed timeline is the read-only view of document 11. Drag and trim come later.
8. The Export button replaces Render. A platform row maps to its output. The sheet renders each needed output once.
9. A change by the person shows in the chat as one line, for example "You changed the text of scene 4.", with "Undo".

#### Settings

1. "AI" lists the agent programs of `listAgents` (document 11). "Use this" saves the id in `~/.config/yumekit/settings.json` as `agent`. With no saved value, the engine uses the first one that is installed, in the order Claude Code, Codex, Cursor.
2. "Limits" shows `limits.generatedVideoSeconds` of the project, with the seconds used, and a field to change it.
3. The old Agent tab moves to Settings as "Use an agent in your own terminal".

### Details of the editor layout

WP29 made these choices where this document and the prototype give no rule.

1. The editor reads the platform catalog from the entry `@yumekit/project/platforms`. The entry has no Node code, as `@yumekit/project/scenes-row`. Document 01 and `scripts/importRules` permit it.
2. The prototype has the theme switch only in its review bar. The editor keeps it as a quiet text button in the top bar, before Settings. At the width of a phone, the button is not shown, and the theme stays as it is.
3. The prototype has no control to remove a platform. The open list of "Add a platform" shows a quiet button "Remove <platform>" for each platform that the project has. It calls `remove_platform`. When the output has no other platform and the project has another output, the tool removes the output with its timeline. `Cmd+Z` brings it back.
4. The platform tabs use the roles `tablist` and `tab`. A tab of an output with no platform shows the label of the output and its shape, such as "16:9". When a part of the shape is more than 32, the tab shows the size.
5. The line under the preview gives the platform and the size only. The words "Click the text in the video to change it" come with WP33, because a click in the preview does nothing before then.
6. A click on a card picks it and moves the playhead to its start, as in the prototype. It does not open the Scene tab. A second click on the picked card removes the pick. The pick stays while the playhead moves, so item 5 of "Details of the editor" in document 11 applies only to the card that the playhead shows. The Scene tab is off when no scene is picked.
7. A card shows the still of document 11 in a 16:9 box, with the full still in it. So a card has one size for each shape.
8. A sound row shows the `text` or the `prompt` of the first clip of its track. The captions row shows "Word by word", because the caption scene shows one word at a time. A second music track gets the row "Music 2". The switch shows the stored state, so it changes when the new snapshot arrives.
9. The line "The voice may not match the scenes now." shows after a result with `voice_may_not_match: true`, and goes after a later result with `false`. A reload removes it.
10. The editor words the failures of a direct change from their `kind`, for example "A scene must be at least one second long." For another kind, it shows "The change did not apply." with the message of the tool.
11. The name of the scene is a text field. The editor calls `put_scene` with the new title when the field loses focus or the person presses Enter. "Edit text" puts the cursor in the first text field of the form and selects its text. A custom scene and a form with no text field get the cursor in the name field.
12. Export shows one row for each platform tab, then one row for each output with no platform. Before an export, a row shows the file name from the rule of "Details of platforms", copied in the editor. After an export, each row takes its file from `files` of the result. "Show the file" opens the video in a new tab, as "Open the video" did in document 11. The progress is one line for each row, with no count of frames. A failure shows under the first row of its output. The other rows of that output say "Did not export".
13. The line under the Export button names the real folder, which ends in `renders`. The editor shows the message of a failed export as the tool gives it, as "Details of Render" in document 11 says. Such a message can name a frame.
14. Settings shows "Limits" read only, with the seconds used and the limit. No harness tool and no engine request changes `limits.generatedVideoSeconds`, so the row tells the person to set it in `media-tools.json`.
15. The Chat tab and Settings both show the agent setup of document 11. Line 2 of the prompt says "tool servers", because the interface does not show the word MCP. The command and the configuration blocks keep their text, because the person copies them as they are.
16. The Make a clip sheet has the title "Make a real video clip" and the layout of the sheets of the prototype. Its texts say "first picture" and give times in seconds. "Add the key" in the sheet opens Settings with that tool open. The full rework is WP32.
17. While a sheet is open, the editor below it is `inert`.

## The start screen

`yumekit` with no arguments starts the home server and opens it in the browser. `yumekit open <folder>` stays.

- The home server is in the same process as the engines. It listens on 127.0.0.1, with its own session token and the same request checks as an engine (document 11).
- It serves the same editor app. The app shows the start screen when the server says that it is the home server.
- `GET /api/home` gives `{ recent, agents, projects_folder }`. `recent` comes from `~/.config/yumekit/recent.json`: the folder, the name, the platforms, the length, and the time of the last change, for at most 20 projects that still exist.
- `POST /api/home/projects` takes `{ request, platform_ids, length }`. `length` is 15, 30, 60, or `auto`. The server makes a folder in the projects folder, creates the project with one output for each size, starts an engine for it, sends the first request to the chat of that engine, and gives the URL of the engine with its token.
- `POST /api/home/open` takes `{ folder }` of a recent project. It starts an engine, or finds the one that runs, and gives its URL.
- The projects folder is `~/Documents/yumekit`. `settings.json` can name another one as `projectsFolder`. The folder name of a project comes from the first words of the request, in lower case with hyphens, with a number when the name is taken.
- The first request that the engine gets is the text of the person, then one line with the platforms and one line with the length.
- The home server stops each engine that it started when it stops.

The Making screen shows five steps. The engine does not report steps. The editor derives each step from the tool calls of the first request (document 12 gives them as events).

| Step         | Done when the request called                               |
| ------------ | ---------------------------------------------------------- |
| Script       | `set_script`                                               |
| Pictures     | `generate_asset` for an image, or `put_scene` for 2 scenes |
| Voice        | `place_narration`                                          |
| Music        | `generate_asset` for music                                 |
| Put together | `set_timeline`, or the request ended                       |

A step that the request never calls shows as skipped when the request ends.

## Work packages

| Id   | Scope                                                                                                                                       | Needs            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| WP26 | The brain runner and the chat interface of the engine (document 12)                                                                         |                  |
| WP27 | Platforms: the catalog, `platforms` on an output, `add_platform`, `remove_platform`, and one file for each platform in `render_video`       |                  |
| WP28 | The four scene clip tools, `off` on a track, and `set_track_off`, with the preview and the renderer                                         |                  |
| WP29 | The editor layout of the prototype: top bar, platform tabs, scene cards with actions, sound rows, the timeline switch, Export, and Settings | WP27, WP28       |
| WP30 | The chat panel, the Scene tab next to it, the scene chip, the suggestions, and "Undo" on each change                                        | WP26, WP29       |
| WP31 | The home server, `yumekit` with no arguments, the start screen, and the Making screen                                                       | WP26, WP27, WP29 |
| WP32 | "Make a real video clip" from a scene, with the key guide in place                                                                          | WP29             |
| WP33 | A text of the preview changes in place                                                                                                      | WP29             |

WP26, WP27, and WP28 start together.

### Checks

1. WP27: a project with YouTube and TikTok gets Instagram Reel with no new output, and Square with a new output that has the scenes of the nearest shape. Export writes one file for each platform, and two platforms of one output have the same bytes.
2. WP28: each tool is one undo step, changes each output that holds the clip, and reports `voice_may_not_match` only when a voice clip exists. A track that is off is absent from the preview and from the rendered file.
3. WP29: each action of a picked card changes the preview. A card moves by drag and by the keys. Each screen matches the prototype in dark and in light, at 1440, at 1024, and at the width of a phone.
4. WP30: a request shows its answer and its changes while they happen. "Undo" on the last change restores the project. The scene chip adds the picked scene to the request.
5. WP31: `yumekit` opens the start screen. "Make the video" creates the folder, opens the editor, and starts the first request. A recent project opens.
6. Each work package of the editor shows screenshots next to the prototype in its pull request.

## Not in this version

- Drag and trim in the detailed timeline.
- A picker for the voice, the music, and the caption style. "Change" writes a request in this version.
- An approval step for the script before the first pictures.
- Safe areas for each platform, and publishing to a platform.
- A desktop shell.
