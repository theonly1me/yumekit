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
