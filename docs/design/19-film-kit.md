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
