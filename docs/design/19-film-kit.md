# 19. The film kit: faster than a free hand

On 2026-11-24 the owner asked a hard question: a strong coding model with a video framework makes a launch film from a script in ten minutes, so why would a person use yumekit? A test gave the numbers. One agent with a free hand made a 30 second film in 7.5 minutes, with 916 lines of code and a music bed that it wrote as a small synth. Two agents inside yumekit needed hours for a film of the same level, because each shot was a custom scene, and yumekit had no music with no key.

The example videos in both films were made by yumekit, and the free-hand agent used them because they looked good. So the scenes of yumekit are not the weak part. The weak parts are the work that a film needs around them.

## What the free-hand agent asked for

| It wanted                                                         | yumekit today                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| A beat grid as the base of the timeline, with a snap to the beat  | Frames only                                                          |
| Music from a style, with no key                                   | Music needs a key                                                    |
| Screen recordings with known regions and times                    | A video asset is one whole picture                                   |
| Ready scene types for a launch film                               | 19 scene types, none for footage, three shapes at once, or a command |
| A contact sheet after each render, with a warning for a bad frame | One preview picture at a time                                        |
| Each shape from one timeline                                      | Yes. This is where yumekit is already ahead                          |

## Decisions

| Id  | Decision                                                                                           | Why                                                                              |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| K1  | A project has a tempo. Each tool that takes a time also takes beats                                | A film is cut to a beat. An agent that counts frames makes mistakes              |
| K2  | yumekit bundles music that runs on the computer of the person, with no key                         | A film with no music is not finished. The free-hand agent wrote one in 5 seconds |
| K3  | The kit has scene types for footage: a recording with a region, a wall, three shapes at once       | A custom scene for each shot is why yumekit was slow                             |
| K4  | The kit has scene types for a launch film: lines on the beat, a look swap, a command, a wordmark   | The same reason                                                                  |
| K5  | One tool gives a contact sheet of the whole video                                                  | An agent checks pace and layout from one picture, not from thirty calls          |
| K6  | A project can hold shared code for its custom scenes                                               | Ten scene files each had a copy of the same font loader and theme                |
| K7  | The test of this document is a time: an agent makes the launch film in yumekit in under 10 minutes | The claim "faster than a free hand" needs a number                               |

## Tempo and beats (K1)

- `project.json` gets `tempo`: beats each minute, 60 to 200. A project with no value has no tempo, and nothing changes for it.
- `set_tempo` sets it, as one undo step. `get_project` gives `tempo` and `frames_per_beat`.
- Each input that is a frame count or a start frame has a twin in beats: `start_beat`, `duration_beats`, in whole and half beats. A call gives frames or beats, not both. The harness turns beats into frames and rounds to a frame.
- `get_timeline` gives each clip in frames and in beats.
- The motion functions take `beatFrames` from the stage, so a scene can bring a line in on each beat: `sequence({ every: "beat" })`.
- The editor shows the beats as small marks on the detailed timeline.

## Music with no key (K2)

- A new bundled server `tools/local-music`, with the capability `music`. It makes a music bed from code: drums, a bass, chords, and a lead, at the tempo of the call, for the length of the call, with a clean end.
- Inputs: `style`, `tempo`, `duration_seconds`, `seed`, and `energy` (a curve of 2 to 8 values from 0 to 1 over the length, for a build and a drop). Styles of the first version: `minimal`, `warm`, `bright`, `night`, `cinematic`.
- The sound must be good enough to post. The builder writes the synth with care for the mix (level, a soft limit, no click at a note start), makes a sample of each style, and measures loudness. The owner listens before a style ships: the list of styles is data with an `approved` mark, as the voices are. No approved style means that the server offers none.
- The order with no pick for `music` is: `gemini`, each other server, `local-music`, and `sample` last.
- The Music view shows it as "Music from this computer", with the style choices and "Try another" (a new seed).

## Scene types for footage (K3)

| Name      | What it shows                                                                                                                                      | Main props                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `footage` | One video or picture asset, cut to a region, from a start time, at a speed, with a camera path of 2 to 4 stops, in a plain window or with no frame | `assetId`, `region`, `startSeconds`, `speed`, `stops`, `window` |
| `wall`    | 4 to 16 video or picture assets as a grid that comes in on the beat                                                                                | `assetIds`, `columns`                                           |
| `shapes`  | The same moment of one to three video assets side by side, in the shapes of their files                                                            | `assetIds`, `labels`                                            |

- A region is `{ x, y, width, height }` as shares of the picture from 0 to 1. A stop is a region with a beat or a time.
- `shapes` keeps its videos in step: each one shows the same time of its file, whatever the frame of the scene.
- A recording can have named regions and times in its asset record: `marks` with a name, a region, and a time ("the preview", "the look changes"). `import_asset` takes them, and `footage` takes a mark name in place of a region. The tool `mark_asset` adds one.

## Scene types for a launch film (K4)

| Name        | What it shows                                                                                | Main props                   |
| ----------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| `lines`     | 1 to 4 short lines, each as large as the width allows, one on each beat, the old ones dimmed | `lines`, `accentLine`        |
| `look-swap` | One video asset for each look, cut on the beat, with the name of the look                    | `assetIds`, `labels`         |
| `command`   | A command that is typed in a pill, with a cursor, under a wordmark or a line                 | `command`, `heading`, `note` |
| `counts`    | 1 to 3 numbers that count up next to their labels                                            | `items`                      |

Each new scene follows each rule of document 08 and document 17, draws in each look, and has a wide, a tall, and a square layout.

## The contact sheet (K5)

- `contact_sheet` takes `output_id`, `every_seconds` (default 1), and `columns`. It gives one picture with one frame for each step, each with its time and its beat.
- It adds a list of warnings: a frame that is one color, a frame in the middle of a transition at a cut that the caller marked as a beat, text that leaves the picture, and a video asset that shows its first frame for more than a second.
- The scene guide tells the AI to call it after each build of a timeline.

## Shared code for custom scenes (K6)

- A project can have the folder `scenes/_shared/` with modules that each custom scene can import as `./_shared/<name>`. `put_shared_code` writes one, with the same check as scene code.
- A font asset loads for the whole stage when the project names it in `fonts` of `project.json`. A scene then uses the font by its family name.

## The lead agent

The owner set this rule on 2026-11-24: the lead agent is the creator. It carries the vision of the person, it sees all of the work, and each other agent and each media model is a tool that it calls. yumekit never calls another agent or a media model by itself for a creative step.

| Id  | Decision                                                                                                                          | Why                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| K8  | The lead agent sees the whole video as one piece of work, in one call                                                             | Ten scenes that it wrote and checked one by one became ten styles                    |
| K9  | A video is one composition: the scenes share one layout system, one set of parts, and one tempo                                   | The film of a free hand was one coherent piece of code. That is why it read as one   |
| K10 | Each helper is a tool of the lead agent: a picture model, a voice, music, a video model, and a helper agent for one piece of work | The lead decides when a helper works, what it gets, and if its result is good enough |
| K11 | A creative step from the editor goes to the lead agent as a request. An exact change stays direct                                 | The person talks to one creator. A button must not start a model behind its back     |

### The whole work in one call (K8)

- `get_work` gives the lead agent everything that makes the video: the script, the tempo, the look, each timeline with its clips in beats, the code of each custom scene and of each shared module, the props of each kit scene, the cast, and the assets with their labels and marks. It is text, in one result, with a size limit and a way to ask for one part when the project is large.
- `put_work` takes several changes in one call: shared code, scenes, and a timeline. It checks all of them together, and it applies all or none, as one undo step. So the lead writes a film as one piece and not as ten calls that each pass alone.
- The scene guide says: write the shared parts first (the frame, the type styles, the timing), then the scenes that use them.

### One composition (K9)

- A project can name one module of its shared code as its `frame`: a component that draws around each scene of the video, for the parts that stay on screen (a mark, a progress line, a margin grid). The stage draws it once for the whole video, above the scenes and below the captions.
- The kit scene types for films of this document use one layout grid and one type scale from the look, so two of them next to each other read as one film.
- The instructions of the AI get the rules of restraint: few things on screen, one idea in each scene, even cuts on the bar, the same margins in each scene, and no voice unless the person asks for one. A voice is one read of the whole script, never one recording for each short line.

### Helpers as tools (K10)

- The media tools stay as they are: the lead calls `generate_asset`, and it picks the model within the picks of the person.
- A new tool, `ask_helper`, starts one helper agent with a brief from the lead and the parts of the work that the lead names. The helper has the same yumekit tools, limited to the scenes or the assets that the brief names, and it cannot export, remove the work of the person, or start a helper. Its result comes back to the lead as text with the list of what it changed. The lead checks it, and keeps or undoes it.
- The helper runs through the same agent program as the lead (document 12), with its own short session. One helper runs at a time in the first version.
- The chat shows a helper as a step of the lead ("A helper drew scene 3"), never as a second voice.

### The editor and the lead (K11)

- Direct, with no request: a text, a move, a length, a transition, a look, a file of the person, a volume, a track on or off, an undo.
- Through the lead, as a request that the person sees in the chat: a new picture, a new voice, new music, a real video clip, a talking clip, a sound, a sharper copy. The sheets for these keep their choices (the model, the camera move, the length, the price), and their button sends the request with those choices. The lead makes the call, and it can refuse or ask when the choice does not fit the video.
- A picker of Settings sets a default. It starts no work.
- With no agent program, these buttons say what is missing. They do not call a model.

## Work packages

| Id   | Scope                                                         | Needs |
| ---- | ------------------------------------------------------------- | ----- |
| WP58 | Tempo and beats, the contact sheet, and shared code and fonts |       |
| WP59 | `tools/local-music` with its five styles and its samples      |       |
| WP60 | The seven new scene types, and marks on an asset              | WP58  |
| WP61 | The test of K7                                                | All   |

### Checks

1. WP58: a clip placed at beat 8 with tempo 120 at 30 frames each second starts at frame 120. A contact sheet of a 30 second video is one picture with 30 frames and their times. A warning names a one-color frame.
2. WP59: each style makes a file of the asked length within one frame, at the asked tempo, with a peak under -1 dBFS and no click at the start or the end. The same seed gives the same bytes.
3. WP60: each new scene passes the tests that each kit scene has. `shapes` shows the same file time in each of its videos at any frame of the scene.
4. WP61: one agent on a fresh project, with the script of the launch film and the recordings as assets, makes a 30 second film with music in under 10 minutes of wall time, and the film is exported. The same script and assets go to an agent with a free hand. The owner sees both films with no names on them and picks. The times, the calls, and the pick go into this document.

## Not in this version

- Music with a melody that follows a picture.
- A recording that the product makes of itself.
- Sound effects with no key.

## Details of WP58

These facts and choices came from the build of WP58 on 2026-11-24.

1. `tempo` is a number from 60 to 200, not only a whole number. The edit `setTempo` with no value removes it. The tool `set_tempo` always takes a value.
2. Each frame input of a timeline or clip tool has a twin in beats: `start_beat`, `duration_beats`, `scene_start_beat`, and `asset_start_beat`. The tools are `set_timeline` (also inside each clip and its transition), `add_clip`, `update_clip`, `place_narration`, `place_sound`, `place_video`, `resize_scene_clip`, and `set_transitions`. `replace_music` has no frame input. The picture tools keep frames, because `contact_sheet` checks the whole video.
3. The tool table of the harness makes the twins for each tool from its schema, so a tool gets them by the name of its input. The twin and the frame input are both optional in the schema that the agent sees. Before the tool runs, the table turns beats into frames with the tempo of the project. A start rounds to the nearest frame. With a start and a length in beats, the length is the rounded end minus the rounded start, so two clips that touch in beats touch in frames. A call with both units fails with `frames-and-beats` and names the place, for example `tracks[0].clips[0]`. A call in beats with no tempo fails with `no-tempo`.
4. `get_timeline` gives `start_beat` and `duration_beats` for each clip and `length_beats`, rounded to 0.01. `get_project` gives `tempo` and `frames_per_beat` (both `null` with no tempo), `fonts`, and `shared_code`.
5. The motion functions stay pure: a scene reads `beatFrames` from `useSceneContext` and gives it to `sequence`, for example `sequence({ count, framesPerSecond, every: "beat", beatFrames })`. Item n starts at `startFrame + n` beats, rounded to a frame. The stagger does not shrink to fit the clip. With no tempo, `sequence` uses the even stagger, so the same code works in each project.
6. The detailed timeline shows a short mark at each beat and a longer mark at each fourth beat, under the second marks, and "120 BPM" in front of the ruler. Past 160 beats it shows only each fourth beat. The editor reads `@yumekit/project/tempo`, a new entry with no Node code.
7. `contact_sheet` takes `output_id`, `every_seconds?` (default 1), `columns?`, and `beat_cuts?`: the beats that the caller marks as a hard cut. The sheet has at most 60 frames: a longer video gets a larger step, rounded up to 0.1 seconds, and the result says it. With no `columns`, the sheet is about 1.6 times as wide as high. A cell is at most 320 pixels wide, so the sheet is about 1600 pixels wide. Each frame shows its time, its frame, and its beat. A cell under 240 pixels shows `4.0s f120 b8`, and the title explains the letters.
8. The kept page of WP53 draws the frames with the fast capture of a video render, at the smallest scale that covers a cell. A plain page of the same browser joins them into one PNG. On the computer of the owner, the 30 second explainer film (the project `examples/explainer`, which pull request 87 later removed from the repository) at 1920 by 1080, with 10 custom scenes and 12 recordings, gives a sheet of 30 frames in 1.5 seconds, and its tall copy in 1.6 seconds. The first picture call of a session takes about 20 seconds for this project, because it starts the browser and makes the frame pictures of the 12 recordings once, as `preview_frames` does.
9. Warnings: `one-color` when each pixel is within 4 levels of the first pixel, and the frame 0.3 seconds later is one color too, so the entry of a scene from a flat background is not a warning. `text-outside` when a text that shows leaves the picture by more than 2 pixels. A text inside its own smaller box with an overflow (a rolling number) and a scene in a transition do not count. `first-frame-video` when `VideoFrame` shows picture 0 of a video asset at frames of the sheet that span one second or more. `transition-at-beat-cut` when a beat of `beat_cuts` is inside the transition of a scene clip, with the clip id for `set_transitions`. A frame with a warning has a red edge on the sheet.
10. The first sheet of the tall copy of the explainer showed a real defect: the wordmark "yumekit" leaves the picture from 27 to 29 seconds.
11. Shared code is `scenes/_shared/<name>.tsx`. The name follows the id rule, so it never matches a scene folder. A scene imports it as `./_shared/<name>`, and shared code imports other shared code as `./<name>`. The check of scene code applies to it, and a failure names `shared code "<name>"`. `put_shared_code` checks each custom scene that imports the module again, and refuses a change that breaks one. A scene that imports shared code that does not exist fails with `scene-import-not-permitted`, and the message names `put_shared_code`. This version has no tool that removes shared code: undo removes a new module.
12. The stage server serves a shared module with a hash of its code in the URL, and the URL of each custom scene has a hash of all shared code. So a kept page loads new shared code.
13. An entry of `fonts` is `{ assetId, family, weight?, style? }`. `weight` is a number, or a range `[100, 900]` for a variable font. The preview page and the render page load each font with `FontFace` before they build the stage. Rule 7 protects a font asset that `fonts` names. The kit scenes keep the fonts of the look.
14. The `hook` scene of the explainer, rewritten with `./_shared/theme` and the project font Geist, went from 123 to 91 lines, with a shared module of 21 lines. Frames 20 and 45 gave the same bytes as before. Frames 75 and 85 differ by at most 2 levels, as two renders of the unchanged project also do: the frame pictures of its videos are not exactly repeatable.
15. The harness has 53 tools: `set_tempo`, `put_shared_code`, `set_fonts`, and `contact_sheet` are new. The project has 21 edit kinds: `setTempo`, `setFonts`, and `putSharedCode` are new.
16. The server instructions name `put_shared_code` and `set_fonts` in step 3, beats in step 7, and `contact_sheet` in step 8. The AI in the chat gets rule 25: look at the whole video with one `contact_sheet` after each build or change of the timeline. The scene guide names shared code, `beatFrames`, project fonts, `sequence` with `every`, and `contact_sheet` in rule 10 of Motion design.
17. The CI runner showed `yumekit render` fail at random with `scene-not-repeatable` for a kit `title-card`. With 12 renders at the same time on the computer of the owner, 9 of 1116 renders failed. In each failure, the picture of frame 5 after a seek back from frame 11 had 9 pixels of the edge of the accent circle from an unfinished browser picture, and a second screenshot of the same seek gave the right picture. A still now takes screenshots until two in a row are the same, at most five. After the change, 0 of 900 renders failed. A frame of `render_video` uses the fast capture and has no such second look: under heavy load, a frame of a video can still show the same small fault.
18. The test `serveBridge.sameResults.test.ts` timed out at random on the CI runner. Its first speech call used the natural voice, which downloads about 150 MB into the new configuration folder of each test run. With 8 runs at the same time, that call took 100 to 110 seconds, close to the limit of 120 seconds. The two test projects now pick the test server for speech in `media-tools.json`, so the test downloads nothing. The same 8 runs then took 16 seconds each.

## Details of WP59

These facts and choices came from the build of WP59 on 2026-11-24.

1. `tools/local-music` is a bundled server with one model, `music-bed`, and the label "Music from this computer". It needs no key, no download, and no network. It writes a stereo WAV file at 48 kHz, leveled to -17 LUFS with a peak at -1.5 dBFS, and a dip of 2 dB at 2.6 kHz that leaves room for a voice. A call takes at most 180 seconds of music. 30 seconds take about 2 seconds on a MacBook with an M3 Max.
2. `generate_music` takes `prompt` and `duration_seconds`, and optionally `style`, `tempo` (60 to 200, 110 by default), `seed` (1 to 999999), and `energy`. With no `style`, the words of the prompt pick one, for example "dark" or "late" picks `night`. With no `seed`, the seed comes from the prompt. With no `energy`, it is `[0.35, 0.55, 0.75, 0.8]`.
3. The description gives the settings `style`, `tempo`, and `seed`. A choice setting can have `choice_details` with a name, one plain line, and `approved` for each choice (document 10, rule 11). The harness passes it to the agent and the editor.
4. The styles are data in `tools/local-music/src/styles/styleList.ts`, each with `approved`. None is approved yet. A server with no approved style lists no model and no `generate_music`, so the order with no pick and the picker skip it, and the reasons of document 18 (F2) stay.
5. The development build: the server also offers each waiting style when its folder `src` is next to `dist`, which is true for a build from the source and never for a release, because a release ships only `dist`. The editor shows a waiting style with "Not approved yet". `pnpm run check-release` fails when a release offers a style with `approved: false`.
6. The music has bars of four beats. The end hit falls on the last bar start that leaves at least 1.6 seconds, and it plays the chord of the key, with a ring and a fade of 0.35 seconds. The energy of each bar picks the parts that play and how open the pad filter is. A bar before a new part gets a fill, and in `bright`, `night`, and `cinematic` a rise of noise. `minimal` and `cinematic` keep only the pad in the bar before the end hit.
7. The seed picks the key, the chord order, and the patterns of a style. The same input gives the same bytes. Each sound has a smooth start and end, and the file starts and ends at 0.
8. The owner accepted the bed of the free-hand film as a floor. `minimal` follows it on purpose: the chords i VI III VII, a four on the floor kick, off-beat hats, a clap on 2 and 4, an eighth note bass, a soft sine pad, eighth note plucks, a quiet bar, and a boom at the end.
9. The order with no pick for `music` is `gemini`, each other server, `local-music`, and `sample` last. `local-music` comes after `local-voice` in the list of bundled servers and in the order.
10. The Music view has the group "Music from this computer" under "In your video now", only when the server offers a style. Each style is a row with its name, its line, and "Use this". "Use this" calls `generate_asset` with the server `local-music`, the style, seed 1, and the length of the video without its music, then `replace_music` with the new asset, as one act with one undo. "Try another" makes the style in use again with a new random seed. The asset id is `music-<style>`, then `-2` and so on. With no scenes, the buttons are off and the line says to make the video first.
11. With two or more outputs of different lengths, the music fits the longest, and `replace_music` cuts it in the shorter ones. When WP58 adds the tempo of a project, "Use this" can pass it as `tempo`.
12. Rule 16 of the instructions of the AI adds: "With no other music ready, use the music of this computer." The description of `generate_asset` names `style`, `tempo`, `seed`, and `energy` for this server.
13. The tests of the editor and the engine that need a project with no music service turn off `local-music`, as they turn off `local-voice`.
14. The samples for the owner are in the folder `wp59-music` next to the worktrees, with a `README.txt` that gives the length, the loudness, the peak, and the kick times of each file. The builder could not hear them.

## Details of WP60

These facts and choices came from the build of WP60 on 2026-11-24.

1. The seven film scenes are in `packages/scene-kit/src/scenes/film/`, one folder for each. The parts that they share are in `src/film/`: the layout grid (`useFilmGrid`), the timing on the beat (`useFilmTiming`), the heading, the window, the label, the picture of a region, and the math of a region. Their schemas are in `src/schemas/film/`.
2. One layout grid for all seven. The margin is 13 units in wide and 8 units in square and tall. The heading starts 10 units from the top in wide, 8 in square, and 14 in tall. Footage starts 29 units from the top in wide, 25 in square, and 34 in tall, or at the top of the heading when there is no heading. The content ends 3 units above the caption area, so an entry that rises never enters it.
3. One type scale from the look. The pack gets six text roles: `filmHeading` (9.6, 8.4, and 8.8 units in wide, square, and tall), `filmLine` (14, 12, 12), `filmLabel` (2.8, 3.2, 3.4), `filmNumber` (11, 10, 11), `filmWordmark` (20, 17, 17), and `filmCommand` (3.8, 4, 4.2). Each look has the same values. The heading uses the display font of the look.
4. `footage`, `wall`, `shapes`, `look-swap`, and `counts` take an optional `heading` and `accent`. `accent` is a part of the heading in the accent color. `lines` has `accentLine`, a line number from 1. With no accent prop, a film scene has no accent color. A look with no accent that reads on its background (`paper`) keeps the text color, as rule 2 of the details of WP50 says.
5. Motion. Each film scene brings its parts in on the beat with one curve: a rise of 2.5 units and a fade over 0.5 seconds on the entry curve of WP49, with no spring and no bounce. With no tempo, a beat is half a second. A calm look gives a fade. Rule 2 of document 08 still holds: a clip that is too short for the entries runs them faster.
6. A film scene draws a quiet backdrop: the background color of the look, with the grain of `editorial`. The glow of `midnight` and the moving grid of `neon` draw attention to themselves, and they changed at each cut.
7. Footage in wide. `footage` and `look-swap` put the heading in a column of 54 units at the left and the window beside it, when that window is larger than a window below the heading. A region that is wider than about 2.8 to 1 goes below the heading at the full width. Both scenes keep room for a label under the window, so a cut from `footage` to `look-swap` with the same region keeps the window in the same place and size. In square and tall, the window is always below the heading. `wall` and `shapes` always start below the heading.
8. A region of `footage` is shown as large as the window allows. The window takes the shape of the region, between 0.5 to 1 and 4 to 1. When the shape of the window differs from the region, the view grows around the region and stays inside the picture. A screen recording of 2880 by 1800 reads at 800 pixels of video width when its region is about 0.6 of its width and its shape is wider than 3 to 1 (it is then shown at 1.2 times its size in a 1920 wide video). A region of the whole recording does not read.
9. `stops` of `footage`: the view arrives at each stop at its beat or its second, with a move of 0.8 seconds on the draw curve of WP49. A stop with no time spreads evenly over 70 percent of the clip. The window takes the shape of the first stop.
10. `wall` takes 2 to 16 assets, not 4 to 16, because a film often has three examples. It picks the column count that makes each picture largest, and it prefers full rows when their pictures are at least 75 percent of that size. With no heading, the grid is centered between the top of the heading and the end of the content.
11. `shapes` places one to three assets at one height, in the order of `assetIds`, in one row or more rows, whichever gives the largest pictures. Each asset keeps its own shape. Each video shows the frame `round(startSeconds × fps) + frame` of its file, so the entry on the beat never moves the time of a video.
12. `look-swap` takes `assetIds` (2 to 6, an asset may come twice), `labels`, `marks` (one mark name for each asset), `region`, and `beatsEach` (default 1). The first look shows when the window comes in, and each next look comes `beatsEach` beats later. The last look stays to the end of the clip, so a clip of 1 frame shows the last look. Each cut starts its video at the time of its mark, so the same moment of the same content shows in each look.
13. `command` types its command at 30 characters each second, from beat 1.5 after the wordmark. The command is in a system monospace font (`ui-monospace`, then SF Mono, Menlo, Consolas, DejaVu Sans Mono, Liberation Mono), because no look has a monospace font. The pill keeps the room of the whole command, so the layout does not move while the text types.
14. `counts` counts each number up over 1 second from its beat, in a row in wide and stacked in square and tall.
15. Marks. An asset record has `marks?`: each mark has a `name` (1 to 60 characters, one name once on an asset), and a `region`, `seconds`, or both. A region stays inside the picture. Only an image or a video asset has marks. The edit `setAssetMarks` replaces the marks, as one undo step, and no marks removes the field. `import_asset` takes `marks`. `mark_asset` adds a mark, replaces a mark with the same name, or removes one with `remove: true`, and refuses a mark with no region and no time (`mark-is-empty`). `list_assets` gives `marks`.
16. `SceneAsset` of the scene contract gets `marks`, so a scene finds a mark by name when it draws. A name matches with no regard to case and to spaces at the ends. `put_scene` refuses a `mark` of `footage`, of a stop, or of `look-swap` that its asset does not have, with `mark-not-found` and the list of the marks of the asset. A mark of an asset that does not exist is not checked, as for other asset ids.
17. The scene form of the editor shows a list of asset ids (`assetIds`) as a list of pickers, "Add a video or image", with a move up, a move down, and Remove for each. The JSON Schema gives the list `assetKinds` and a plain `title`: "Videos and pictures", "Videos", and "Looks".
18. The harness has 54 tools: `mark_asset` is new. The project has 22 edit kinds: `setAssetMarks` is new. The kit has 26 scenes. Step 3 of the server instructions names the film scenes and `mark_asset`.
19. The recordings and the example videos of the old explainer are not in commit `bf96bc2`, which has only pictures. They are in `c465dc2^`, the last commit before pull request 87 removed them.

### The film test of WP60

An agent (the builder, who knew the tools and had looked at the recordings) made the 30 second launch film of the brief through the tools of the harness only: tempo 120, nine kit scenes, a cut on each bar or two, no voice, and `minimal` music from `local-music`. No custom scene code.

| Run | What changed before the run                    | Wall time, first call to exported file | Tool calls |
| --- | ---------------------------------------------- | -------------------------------------- | ---------- |
| 1   | The first version of the seven scenes          | 2 minutes 45 seconds                   | 37         |
| 2   | Footage beside the heading, full rows in walls | About 3 minutes 30 seconds             | 34         |

Run 2 includes one stop for a change of the scene code and two corrected marks. A render of the 30 seconds took 42 to 75 seconds. Each `contact_sheet` gave no warnings.

The film next to the free-hand film, shot by shot, after run 2:

1. Opening: weaker. The free-hand film typed a prompt and showed a finished video beside the three lines. The kit film shows only the three lines for 4 seconds.
2. "Type what you want.": equal after the fix. The region of the prompt now fills the width and reads at 800 pixels. In run 1 the window was half as wide, and its text did not read.
3. "Your own AI does the work.": weaker. The free-hand film drew the names of the agents and the steps in large text. The recording of the steps reads, but at a smaller size.
4. Examples: equal. Three examples in one row. In run 1 they were in a grid of two columns with an empty cell.
5. "One idea. Every platform.": equal.
6. "Click to change." and the look swap: equal after the fix. The window is now beside the heading and larger, and it stays in the same place across the cut.
7. "On your computer. No account. Open source.": equal.
8. End: equal.
9. Across the film: weaker. The free-hand film has a small mark and a row of beat marks that stay on screen for the whole film, which joins the shots. That is the `frame` of K9, another work package.

The agent cannot watch a video or hear sound. The owner must judge the motion and the music.

Known limits: a wide region in a tall output is a thin strip, because the scene never cuts the region. The first frame of each scene is the background only, because each part enters on its beat.

## Details of WP62

These facts and choices came from the build of WP62 on 2026-11-24.

1. `get_work` gives the work as plain text in the second text block of the result, in this order: the story (name, video style, look, time and tempo, frame, fonts, style, palette, voice, cast, script), the shared code, each scene with its notes, its props as JSON, and its code, each timeline with each clip in beats and frames, and the assets with their labels. `structuredContent` has `revision`, `part`, `characters`, and `left_out`, and not the text, so a client that shows both does not get the work twice.
2. The limit is 60,000 characters, which is about 17,000 tokens of code, under the 25,000 tokens that Claude Code takes from one tool result by default. The limit is from that number, which is an inference from the documents of Claude Code and was not measured. Over the limit, the scenes that fit keep their code, and each other scene shows its props and its line count, with its id in `left_out`. `part` is `all`, `story`, `code`, `timelines`, or `assets`, and `scene_ids` limits the part `code`.
3. Measured on the 30 second explainer of WP58 (10 custom scenes, 1,400 lines of scene code, 12 recordings): the whole work is about 69,000 characters. `get_work` gives 59,208 characters with the code of 7 scenes, and names `shapes`, `type`, and `yours`. The story is 672 characters, the timeline 1,240, and the assets 2,536. A film that uses shared code and kit scenes is much smaller.
4. `put_work` takes `shared_code`, `scenes`, `timelines`, `frame` (a name, or `null` to remove it), and `remove_person_work`. Each time input of a timeline has its twin in beats, as in `set_timeline`. Before it changes anything, it checks each part in parallel against the shared code of the project and of the call: each shared module, each scene, each kept custom scene that imports a module of the call, and the frame. A failure is `work-not-valid` with one entry in `issues` for each part that failed, with its path, for example `["scenes", 1]`. All edits go in one `applyChange`, in the order shared code, scenes, frame, timelines, so the call is one undo step, and the protection of document 18 applies to the whole call. A call with no part fails with `work-empty`.
5. The frame is `frame` in `project.json` and the edit `setFrame`. The rule of references refuses a frame that names no shared code. `put_work` checks the frame as a scene, so its default export must come from `defineReactScene`. The renderer adds it to the stage as the scene `_frame` on one more scene track, with one clip from frame 0 to the end of the video, above the last scene track that is not a caption track. The stage gives its box no pointer events. The preview and the render use the same page data, and a test compares their pixels and runs the repeat check of a video render.
6. The props of the frame are `{ scenes }`, the clips of the scenes row, so the frame finds the current scene from the frame number. The scene guide explains this in its rule 13.
7. Each creative button of the editor sends a request with `details`: "Use exactly these tool inputs, in this order:" and one line `<n>. <tool> <JSON input>` for each call. The visible text says the choices in words: the model, the length, the camera move, and the start and end pictures by their labels. Rule 29 of the instructions tells the AI to use the inputs as given. The asset id is in the request, so the sheet finds the result in the project when the answer ends: the clip of `video-<asset id>`, the still, the music in use, or a done `make_sharper_copy` step. With no result, the sheet shows the answer of the AI as the failure, for example a question about the camera move.
8. The requests: "Make the still", "Make the clip" (with each `place_video` of the outputs that hold the scene), the talking clip, "Use this" and "Try another" of "Music from this computer", and the sharper copy of Export. A `place_video` of such a request has `remove_person_work: true`, because the person asked to replace the scene. The upload of the picture of a scene stays direct: it is a file of the person.
9. While the request runs, the sheet shows "The AI is making the clip" and the progress of the step that runs. With no agent program, or with a program that is signed out, the buttons are off and the sheet says what is missing. The request of a button is one chat request, so it waits for no other request, and it fails with `chat-busy` while the AI works.
10. The test fake agent has the step `followRequest`: it runs the tool lines of the request in order and prints a step for each. The browser tests of the clip, the talking clip, the music, and the sharper copy use it.
11. `ask_helper` takes `brief`, `scene_ids`, and `asset_ids`. The engine starts one more turn of the program of the running request, with no session, the helper instructions of `@yumekit/brain`, the working folder `<project>/.yumekit/helper`, and the server command of the lead with `--helper <token>`. `yumekit mcp` passes the token to the engine in the header `x-yumekit-helper`. The engine accepts the token only while that helper runs, so the exception to "one request at a time" holds only inside the request of the lead.
12. A helper may call the read tools, the preview tools, and `contact_sheet`, and it may write with `put_scene`, `put_work` (scenes only), and `generate_asset`, each only for the ids of its brief. Each other call fails with `helper-not-permitted`, and its tool list shows only these tools. Its calls are by `ai`, so they join the change entry of the lead, and they are not steps of the lead. The chat shows the one step "A helper works on 1 scene" while it runs, and "A helper made a part of the video" after it.
13. With no chat request, for example a terminal agent or `yumekit mcp` with no engine, `ask_helper` fails with `no-helper`. A second helper while one runs fails with `helper-busy`. Stop also stops the helper.
14. Cursor writes its configuration files in `<project>/.yumekit`, next to the working folder, so a helper of Cursor rewrites the files of the lead while the lead runs. The lead has already read them. This is an inference and was not tested with Cursor. Codex has a time limit for one tool call, so a long helper can make the `ask_helper` call of a Codex lead fail. This is also an inference, from the setting `tool_timeout_sec` of Codex, and was not measured.
15. The harness has 57 tools: `get_work`, `put_work`, and `ask_helper` are new. The project has 23 edit kinds: `setFrame` is new. `get_work` lists the marks of each asset (WP60) with their name, region, and time.
16. The real run on 2026-11-24 used Claude Code 2.1.331 with `ANTHROPIC_MODEL=haiku`, no media key, and a temporary configuration and project. "Make a short 8 second launch film for a note taking app called Quill. Three scenes, with music and no voice." took 49 seconds. The AI called `get_work` first, then `set_tempo`, three `put_scene` calls with kit scenes, the music of this computer, `set_timeline` with the cuts on the beat, and one `contact_sheet`. It did not call `put_work`: it wrote three kit scenes and no code. The description of `put_scene` now points to `put_work` for two or more scenes.
17. "Use this" for the style Night sent the request with its two tool lines. The AI called `generate_asset` and `replace_music` with the exact inputs, and the sheet showed "The video now has Night music."
18. "Give the second scene to a helper" took 36 seconds. The lead called `ask_helper`, the helper drew the scene as custom code, and the lead checked it with `get_scene` and two `preview_scenes` calls. The change entry had one undo step.

## Details of WP63

These facts and choices came from the first timed film test (WP61) and the build of WP63 on 2026-11-24.

### The test

The lead agent (Claude Code on Opus, one chat request with the text of the brief, no help) made the 30 second launch film in 606 seconds with 49 tool calls. An agent with a free hand made the same film in 454 seconds. The limit of K7 holds, but yumekit was slower than a free hand. The export measured -20.0 LUFS with a true peak of -5.9 dB. The film of the free hand measured -12.6 LUFS.

The record of the Claude Code session gives the time of each step:

| Part of the work                                                                                                      | Wall time            | Calls |
| --------------------------------------------------------------------------------------------------------------------- | -------------------- | ----- |
| Read the work, the kit, the tools, the guide, and the assets                                                          | 17 seconds           | 6     |
| Set the name, the tempo, the font, the platform, and the music                                                        | 5 seconds            | 5     |
| Look at the 12 recordings: 10 temporary scenes, 2 contact sheets, 2 `preview_frames`                                  | 2 minutes 10 seconds | 6     |
| Write the script, the bible, the music again, and 704 lines of custom code for 9 scenes, a shared module, and a frame | 3 minutes 51 seconds | 4     |
| Check and correct (contact sheets, previews, four more writes, transitions)                                           | 2 minutes 50 seconds | 16    |
| Remove the 10 temporary scenes and the first music, one call each                                                     | 4 seconds            | 11    |
| Render                                                                                                                | 44 seconds           | 1     |

### Why the lead wrote its own scenes (measured and inferred)

1. Measured: the lead used no kit scene. Its shared module `film` drew the same parts as the film kit: `Lines` is the kit scene `lines`, `Heading`, `Window`, and `Placed` are the heading and the window of `footage`, and the end scene is `command`.
2. Measured: the brief asked for the colors #0c0c0d, #ecebe8, #908f8b, and #d9c9a8 and the font Geist. A kit scene took its colors and fonts only from one of the five looks, and none of them has these colors. The first lines of the shared module of the lead are these four colors and `FONT = "Geist"`.
3. Measured: two parts had no kit input. The scene "Your own AI does the work." showed a crop of a recording with the three program names beside it. `footage` had no lines beside its window. The scene of examples started each video at its own second. `wall` had one start for all.
4. Measured: the instructions sent a film to custom code. Rule 26 said "write the shared parts first (the frame, the type styles, the timing)", rule 27 said "the same margins in each scene, from the shared code", and rule 11 said "Do not set colors or fonts that the look does not have". With colors that no look has, the only path that followed the brief was custom code.
5. Inferred: the cause is item 2, helped by items 3 and 4. The thinking of the session is not in the record, so the reason of the agent is not measured.

### The fixes

1. `preview_assets` shows video and picture assets before they go in a video, with no scene and no timeline. It takes 1 to 16 assets, each with `asset_id`, `region?`, `mark?`, `from_seconds?`, `to_seconds?`, and `count?` (2 to 24, default 12). A video gives one JPEG picture with frames at even steps, with the time of each frame, a title with the id, the size, and the length, and each mark as a dashed box with its name. A frame close to the time of a mark has the name of the mark under it. A picture gives the picture, at most 1600 pixels wide. A mark gives its region and starts at its time. FFmpeg takes the frames in one pass for each file, and the kept browser of the picture tools draws the sheet. A sound or a font fails with `asset-has-no-picture`.
2. On the 12 recordings of the test (2880 by 1800 and 1920 by 1080, 3 to 20 seconds), one call with all 12 took 1.45 seconds with the start of the browser, and 1.31 seconds the second time. A closer look at one region of one recording took 0.37 seconds. The 12 pictures are 2.3 MB.
3. `list_assets`, `mark_asset`, the `footage` kit scene, step 1 of the server instructions, and rule 31 of the instructions of the AI point to `preview_assets`. The harness has 58 tools.
4. `remove_scene` takes `scene_id` or `scene_ids`, as one change and one undo step. `put_work` takes `remove` with `scene_ids` and `asset_ids`. The removals come after the scenes, the frame, and the timelines of the call, in the same change. The rules of the store refuse a scene that a clip of the result still shows and an asset that a clip, a cast member, or a font still uses. Before the change, the harness also refuses an asset that a scene of the result names, with `asset-in-use`. The protection of the work of the person is the same as for the rest of `put_work`.
5. Own colors and an own font for the kit. `project.json` gets `lookColors` (`background`, `text`, `muted`, `accent`, each a hex color) and `lookFont` (a family of `fonts`). The edit `setLook` takes `colors?` and `font?`, and `null` removes one. A look font that is not a family of `fonts` fails with `not-found`. `set_look` takes `colors` and `font`, and warns when the text or the muted color has a contrast under 4.5 to 1 on the background. `set_fonts` takes `look_font`, so a font file becomes the font of the kit in one change, and a list without that family removes the look font in the same change.
6. The own colors replace the colors of the look in each kit scene and in each custom scene that reads `useStylePack`. The surface is the text color at 8 percent over the background. The accent is the own accent, and the bars of `bar-chart` are text, muted, and accent. A look with own colors draws a flat backdrop, because the glow of `midnight` and the grid of `neon` have colors of their own. The own font is the display font at weight 600 and the body font at weight 400. The page loads it as a font of the project, so the kit loads no file for it.
7. `footage` takes `items`: 1 to 4 short lines beside the window in wide (the window takes 60 percent of the width), and under it in square and tall. Each line comes in on its own beat after the window, between thin lines, at the new text role `filmItem` (4.6, 4.4, and 4.6 units). `wall` takes `startSecondsEach`, one start for each video.
8. `list_kit_scenes` gives one line that says which film scene fits which part of a launch film, and that the film scenes draw in the own colors and font. Rule 11 now tells the AI to give the colors of the person to `set_look` and the font to `set_fonts` with `look_font`. Rules 26 and 27 now say: set the look first, use the film kit scenes where they fit, and write scene code only for what no kit scene shows. The server instructions and the description of `put_work` say the same. Custom code stays permitted.
9. Loudness: document 04 owns the decision. The renderer levels the whole mix of an export to -14 LUFS with a true peak of at most -1 dB, with one gain and a limiter when the peak needs it. On the audio of the test film, the gain is 6.14 dB with the limiter, and the result is -13.9 LUFS with a true peak of -1.5 dB.
10. An upload of a `.woff2`, `.woff`, `.ttf`, or `.otf` file is a font asset. The Files view takes these files, lists them under Fonts, and has "Use as the font" for a font that is not the font of the video. It calls `set_fonts` with the fonts of the project, the new file, and `look_font`, as one change. The family comes from the file name before the first hyphen or underscore ("Geist-Variable.woff2" gives "Geist"), and a name with "variable" gets the weights 100 to 900. K6 fits this: the font loads for the whole stage, and the kit scenes then use it too.
11. The summary of a change entry of the AI comes from the last text of the answer, not from the first. The last text describes the whole work. The summary is its first sentence, with the next sentences while it has fewer than 4 words ("Done. The script now says ready."), and at most 140 characters. The test run would now have "The launch film is finished and exported as one MP4."
12. The failure text of a wrong output id already listed the outputs that exist (for example "Its outputs are: tall, wide."). The hint now says to use one of them, and that `add_platform` names a new output by its shape.
