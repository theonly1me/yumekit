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
