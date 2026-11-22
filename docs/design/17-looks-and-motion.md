# 17. Looks and motion

The first videos of yumekit had one pale look, six scenes, and one motion: text that rises and fades in. A person compares the result with the work of a motion designer and with the output of video models. This document raises the level of the scenes that code draws: five looks, a set of motion functions, moving backgrounds, twelve new kit scenes, transitions between scenes, and a scene guide that teaches the AI the rules of motion design.

Scenes drawn by code are where yumekit can be better than a video model: the text is exact, the result is the same each time, a change costs nothing, and each platform shape gets its own layout.

## Decisions

| Id  | Decision                                                                                           | Why                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| L1  | A project has a look. A look is a style pack: colors, fonts, a backdrop, and motion values         | One pick changes each kit scene. Document 08 already says that a second pack needs no change to the scenes |
| L2  | yumekit bundles five looks. `midnight` is the look of a new project                                | A dark look with depth reads as video. The pale `paper` look reads as a slide                              |
| L3  | Motion comes from named functions in `@yumekit/scene-kit/motion`, for kit scenes and custom scenes | The AI writes good motion when it calls `enter` and `countUp`. It writes weak motion from bare numbers     |
| L4  | A backdrop moves slowly for the whole scene                                                        | A picture that is still for 3 seconds looks like a slide                                                   |
| L5  | A scene clip can have a transition from the clip before it                                         | A hard cut between each scene is one of the first signs of a generated video                               |
| L6  | The scene guide holds the rules of motion design, and each kit scene follows them                  | The AI follows the guide for custom scenes. The kit is the example                                         |
| L7  | Each motion is a pure function of the frame                                                        | The renderer draws frames in any order (document 02). This does not change                                 |

## Looks

`StylePack` of document 08 keeps its fields and gets these:

```ts
interface StylePack {
  id: LookId;
  label: string;
  colors: {
    surface: string;
    accents: [string, string, string, string];
    glow: [string, string];
  };
  backdrop: "flat" | "glow" | "grid" | "grain";
  cornerUnits: number;
}
```

`accent`, `bullet`, and `bars` of the old form stay, and each pack sets them from `accents`. The values below are the start. The builder checks each text color against its background for a contrast of 4.5 to 1 or more, and corrects a value that fails.

| Look        | Background and backdrop                             | Text      | Accents                                    | Display font            | Body font         |
| ----------- | --------------------------------------------------- | --------- | ------------------------------------------ | ----------------------- | ----------------- |
| `midnight`  | `#0b0d1a`, with two soft glows that drift           | `#f4f2ff` | `#ffb637`, `#ff6b9d`, `#3ddbc4`, `#8f7bff` | Bricolage Grotesque 700 | Inter 500         |
| `studio`    | `#ffffff`, flat                                     | `#0a0a0a` | `#2f5bff`, `#ff3b30`, `#00b37a`, `#ffc400` | Inter Tight 800         | Inter 500         |
| `editorial` | `#f1ece1`, with fine grain                          | `#1b1a17` | `#b4442c`, `#2a5d50`, `#c9972b`, `#3b4a7a` | Fraunces 600            | DM Sans 500       |
| `neon`      | `#050505`, with a grid that moves toward the viewer | `#f5f5f5` | `#c6ff3d`, `#29e0ff`, `#ff3df2`, `#ff8a1f` | Space Grotesk 700       | Space Grotesk 500 |
| `paper`     | As document 08                                      |           |                                            |                         |                   |

- Each font has the SIL Open Font License. The builder reads the license file in the source repository of each font, and bundles the Latin subset as WOFF2 with the license file, as document 08 does.
- `project.json` gets `look`. A project with no value has `paper`, so an old project does not change. A new project of the home server gets `midnight`.
- `get_project` gives `look`. The tool `set_look` changes it, as one undo step. `list_kit_scenes` gives the looks with one line for each.
- The start screen shows the looks as five small moving pictures in a row, "Look", with the name under each. Settings of the editor shows the same row in the group "This video". A pick changes the preview at once.
- A custom scene reads the pack with `useStylePack()`. The scene guide says that a custom scene must take each color and each font from the pack, so a change of the look changes custom scenes too.
- The instructions of the AI get one rule: "Use the look of the project. Do not set colors or fonts that the look does not have, unless the person asks."

## Motion functions

The entry `@yumekit/scene-kit/motion` has no React code. Each function takes the frame and returns numbers or a style object. Each uses `tween` and `spring` of document 02.

| Function    | What it gives                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `enter`     | The style of an element that comes in. Kinds: `rise`, `fade`, `scale`, `slide-left`, `slide-right`, `blur`, `wipe`, `pop` |
| `exit`      | The reverse, for the last frames of a clip                                                                                |
| `sequence`  | The start frame of each of N items, with a stagger, so the last one settles by 70 percent of the clip                     |
| `words`     | For a text, each word with its own `enter`, for a headline that comes in word by word                                     |
| `typed`     | The part of a text that shows at a frame, with a cursor, for a typed line                                                 |
| `countUp`   | A number that runs from a start to an end and settles, with its format                                                    |
| `drift`     | A slow move, scale, or turn that runs for the whole clip and never stops                                                  |
| `pulse`     | A short scale up and back at one frame, to mark a moment                                                                  |
| `draw`      | The share of a line or a shape that is drawn at a frame, for an underline, a ring, a chart line                           |
| `holdSplit` | The frames of a clip as three parts: in, hold, and out, by the rule of the guide                                          |

- `enter` with `pop` and `scale` uses a spring with a small overshoot. Each other kind uses an ease out curve.
- Each function takes `framesPerSecond`, so a motion has the same length in seconds at each frame rate.
- With the setting "reduced motion" of a look (for a calm video), `enter` gives `fade` for each kind and `drift` gives no move. `set_look` takes `calm: true`.

## Backdrops

A backdrop is a component of the kit, `Backdrop`. Each kit scene draws it first. A custom scene can draw it with one line.

| Backdrop | What it draws                                                                          |
| -------- | -------------------------------------------------------------------------------------- |
| `flat`   | The background color                                                                   |
| `glow`   | Two soft color fields of `glow` that move on slow paths, from the scene id as the seed |
| `grid`   | Thin lines in perspective that move toward the viewer                                  |
| `grain`  | The background color with fine noise, the same on each frame                           |

A backdrop uses only CSS and SVG that a seek can set. It uses no CSS animation. The seed makes two scenes of one video differ a little, so a cut between them shows.

## New kit scenes

Each new scene follows the rules of document 08: it never throws, it fits each layout, it keeps the caption area free, and it settles by 70 percent of the clip.

| Name          | What it shows                                                                                       | Main props                           |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `hero`        | A headline that comes in word by word, with one word in the accent and a line drawn under it        | `heading`, `accentWord`, `kicker`    |
| `stat`        | One large number that counts up, with its unit and one line                                         | `value`, `prefix`, `suffix`, `label` |
| `compare`     | Two columns with a title each and up to 5 rows, for "before and after" and "them and us"            | `left`, `right`, `rows`              |
| `steps`       | 2 to 5 numbered steps that come in one after another, each with a line that connects it to the next | `heading`, `steps`                   |
| `chat`        | A typed request and an answer, as two bubbles, for a product that a person talks to                 | `request`, `answer`, `names`         |
| `device`      | A picture or a video inside a browser window or a phone, which tilts a little and settles           | `assetId`, `frame`, `caption`        |
| `split`       | A picture or a video on one half and a heading with a line on the other                             | `assetId`, `heading`, `body`, `side` |
| `logo-reveal` | A name or a logo picture that comes in with a ring or a line drawn around it, and a line of text    | `name`, `assetId`, `tagline`         |
| `checklist`   | A heading and items that get a check mark one after another                                         | `heading`, `items`                   |
| `end-card`    | The last scene: a call to action, a name, and an address or a handle                                | `heading`, `action`, `handle`        |
| `lower-third` | An overlay: a name and a role on a bar at the lower left, above the caption area                    | `name`, `role`                       |
| `kinetic`     | 1 to 4 short lines, one at a time, each as large as the picture allows, on the beat of the voice    | `lines`, `assetId`                   |

- `kinetic` reads the word times of a voice asset when `assetId` is given, as `caption-words` does, so each line comes in when the voice says it.
- `device` and `split` play a video asset with the video element of document 09.
- The six scenes of document 08 get the backdrop and the motion functions. Their props do not change.

## Transitions

A scene clip gets the optional `transition`: `{ kind, durationFrames }`. It describes how this clip comes in over the clip before it on the same track.

| Kind    | What the viewer sees                                             |
| ------- | ---------------------------------------------------------------- |
| `cut`   | No transition. This is the value with no field                   |
| `fade`  | The new scene fades in over the old one                          |
| `slide` | The new scene pushes the old one out to the left                 |
| `wipe`  | A straight edge moves across and shows the new scene             |
| `zoom`  | The old scene grows and fades while the new one grows from small |

- During the transition, the stage draws both clips. The old clip shows the picture of its last frame. The new clip runs from its frame 0. So no clip changes its length, and the sound does not move.
- `durationFrames` is 1 to half of the shorter of the two clips. The default is the frames of 0.4 seconds. A transition on the first clip of a track does nothing.
- The preview page and the renderer use the same stage code, so a frame of the preview and the same frame of the export match.
- `set_timeline`, `add_clip`, and `update_clip` take `transition`. The tool `set_transitions` sets one kind for each scene clip of an output in one call, as one undo step.
- The editor shows a small mark between two scene cards. A click on it opens the five kinds. Settings, group "This video", has "Between scenes" with one kind for the whole video.
- A new project of the home server asks the AI for `fade` between scenes, in the first request.

## The scene guide

`get_scene_guide` gets a part "Motion design", and the instructions of the AI point to it. Its rules:

1. One idea in each scene. A scene of 2 to 4 seconds holds one headline or one number.
2. A scene has three parts: it comes in during the first 20 to 30 percent, it holds, and its last 10 percent is quiet for the transition. Use `holdSplit`.
3. The eye goes to the largest thing first. One thing is the largest. One accent color in a scene.
4. Things come in one after another, never all at once. Use `sequence`. A stagger is 3 to 6 frames at 30 frames each second for small things, and 8 to 12 for lines of text.
5. Nothing is still. The backdrop drifts, and the main thing moves a little for the whole scene. Use `drift`.
6. Text is large. A headline uses 60 to 80 percent of the width. A viewer reads on a phone.
7. A number counts up. A list builds. A comparison shows the old side first.
8. Take each color and each font from the look. Keep the caption area free.
9. Each platform shape gets its own layout: stack in tall, side by side in wide.
10. Check each scene with `preview_scenes` at the frame after it settles, and at one frame during its entry.

The guide has one full example scene that uses `Backdrop`, `words`, `draw`, `sequence`, and `drift`.

## Work packages

| Id   | Scope                                                                                                           | Needs      |
| ---- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| WP48 | The looks: the pack fields, four new packs with their fonts, `look` in the project, `set_look`, and the pickers |            |
| WP49 | The motion functions, the backdrops, and the six old scenes on both                                             |            |
| WP50 | The twelve new kit scenes                                                                                       | WP48, WP49 |
| WP51 | Transitions: the clip field, the stage, the tools, and the editor mark                                          |            |
| WP52 | The part "Motion design" of the scene guide, its example, and the rules of the AI                               | WP49, WP50 |

### Checks

1. WP48: each kit scene draws in each look, in each layout, with no text outside the picture. A text color has a contrast of 4.5 to 1 or more on its background. An old project draws the same pixels as before.
2. WP49: each motion function gives the same value for the same frame, and its settled value at the last frame. A backdrop frame drawn after a seek to frame 60 equals the same frame drawn after frames 0 to 59.
3. WP50: each new scene passes the tests that each kit scene has: bounds, caption area, layouts, bad props, and a clip of 1 frame.
4. WP51: a frame in the middle of a `fade` holds pixels of both scenes. The frame before the transition and the frame after it equal the frames with no transition. The preview and the renderer give the same frame.
5. WP52: a test reads the example scene of the guide through the same check as `put_scene`, and it compiles and draws.
6. Each work package shows frames of a real video in the pull request: the same three scenes before and after.

## Not in this version

- A look that a person builds from own colors and fonts. A brand kit follows.
- Motion along a drawn path, and 3D.
- A transition with a picture or a video as its mask.
- Sound that follows a transition.

## Details of WP48

WP48 made these choices where this document gives no rule.

1. The list of looks is in two places: `lookIds` and `looks` of `@yumekit/scene-kit` (also in the entry `schemas`, which has no browser code), and `lookIds` of `@yumekit/project`, because `project` imports nothing from yumekit. `set_look` takes the list of the kit, and the edit `setLook` takes the list of the project. TypeScript fails the build when the two lists differ.
2. A look has a `label` and one `line`. `list_kit_scenes` gives `looks` with `id`, `label`, and `line`. The order is `midnight`, `studio`, `editorial`, `neon`, `paper`.
3. Each pack sets `accent` to the first accent, `bullet` to the third, and `bars` to the second, third, and fourth. So `paper` keeps its old colors: lamp, then sakura, asagi, and fuji.
4. `cornerUnits` is the corner radius of a bar. `paper` has 1.2, the old value. `midnight` has 1.2, `studio` 0.6, `editorial` 0.2, and `neon` 0. Only `bar-chart` reads it in WP48.
5. `surface` is the color of a card or an empty image area. Each new pack sets `placeholder` to it. `paper` keeps `#dfe4ea`.
6. Each pack has its own `mutedText`, `captionPanel`, and `captionText`. A test checks text and muted text on the background, and caption words on the panel over a white and over a black picture, for a contrast of 4.5 to 1 or more.
7. Corrected values, after a look at each kit scene in each look and layout. `studio`: the fourth accent is `#f5a000`, not `#ffc400`, because a bar of `#ffc400` was faint on white (1.6 to 1). `midnight` and `neon`: the caption panel is the surface color at 92 percent, so a caption reads as a panel on the dark background. All the other values of the table are the start values.
8. The fonts are static instances of the variable fonts of the `google/fonts` repository, cut to the Latin range of Google Fonts with `fontTools`: Bricolage Grotesque at weight 700, optical size 72, and width 100; Inter at 500 and optical size 14; Inter Tight at 800; Fraunces at 600, optical size 72, `SOFT` 0, and `WONK` 0; DM Sans at 500 and optical size 14; Space Grotesk at 700 and at 500. Each file keeps the features `tnum`, `lnum`, and `case`. The license file of each family is `fonts/OFL-<family>.txt`. The license files in the source repositories say SIL Open Font License 1.1. The seven new files are 128 KB.
9. `kitScenesOf(look)` gives the kit scenes of a look. `kitScenes` stays the `paper` scenes. An unknown look gives `paper`.
10. `useStylePack()` is in the main entry of `@yumekit/scene-kit`. In a kit scene it gives the pack of the scene. In a custom scene it gives the pack of the look that the stage page activates with `activateLook`. The stage page and the preview page call it from the `look` of the page data, and load the fonts of the look before the first frame.
11. `StagePageData` of `@yumekit/render` gets `look`. A project with no `look` gives `paper`, and its frames are the same bytes as before WP48 (30 frames of six scenes in three layouts, compared with `main`).
12. The scene guide replaces the part "The paper style" with "The look". It names the tokens of `useStylePack()`, and its two examples use it. `paper` stays in the main entry, so an old custom scene still compiles.
13. `POST /api/home/projects` takes `look`. With no value, the project gets `midnight`. Another value gives `body-not-valid` (400).
14. `apps/editor` may import `@yumekit/scene-kit`, so the look pictures are frames that the kit draws in the browser. Document 01 has the new row.
15. A look picture is the `title-card` of the look with the heading "Your idea, as a video.", drawn at 320 by 180 and scaled to its box. The name of the look is under the picture. A heading of one short word was too small to show the fonts. It plays frames 0 to 89 at 30 frames each second, holds the last frame for 2 seconds, and plays again. With "reduce motion" in the system, it shows the settled frame and does not move. When a backdrop of WP49 comes, the picture shows it with no change.
16. The start screen shows the row "Look" after "How long?". Under the row, one line describes the picked look. At the width of a phone, the row scrolls to the side.
17. Settings shows the row "Look" in the group "This video" of WP39, after the choice of how the video is made. A pick calls `set_look` at once. The editor shows the pick while the call runs, and a failure as one line.
18. `calm` of `set_look` belongs to the motion functions (WP49), because a calm look changes only motion. WP48 does not add it.

## Details of WP51

1. A stored transition has the kind `fade`, `slide`, `wipe`, or `zoom`. `cut` is a clip with no field. The edit `updateClip` takes `transition` with the kind `cut` to remove the field. `set_timeline`, `add_clip`, `update_clip`, and `set_transitions` take `cut` in the same way.
2. The clip before is the clip on the same track that ends at the start frame of this clip. A transition after a gap, or on the first clip of a track, does nothing.
3. The store keeps the `durationFrames` that it gets, so a later change of a clip length never fails because of a transition. The stage uses the smaller of `durationFrames` and half of the shorter clip, rounded down. Next to a clip of 1 frame, a transition does nothing.
4. In a transition of `n` frames, frame `i` (from 0) has the progress `(i + 1) / (n + 1)`. So the frame before and the frame after the transition are the frames of a cut, and no frame inside it equals one of them. The curve is the cubic Bézier (0.65, 0, 0.35, 1), which starts slowly and ends slowly.
5. `fade`: the new clip is in front with the progress as its opacity. `slide`: the old clip moves left by the progress times the width, and the new clip follows at its right edge, 1 pixel over the old clip. Both moves are whole pixels, and the overlap covers the edge at a scale of 0.5, so no line shows between them. `wipe`: the new clip is in front, cut by an edge that moves from right to left, in the direction of `slide`. `zoom`: the old clip grows to 1.2 times its size, and the new clip grows from 0.9 to its size in front of it while it fades in. The old clip stays fully opaque behind the new one, so the background of the page never shows. A start at 0.9 keeps the edge of the new picture faint.
6. Each scene track keeps its own layer. In a layer, the old clip is behind the new clip. Scenes on the other tracks, for example the captions, draw as before.
7. The stage seeks the old clip at its last frame on each frame of the transition. A seek to any frame from any earlier state gives the same picture, because the stage mounts the clips that the frame needs and sets their look from the frame alone.
8. `set_transitions` takes `output_ids?` (default: each output), `clip_ids?` (default: each clip of the scenes row), `kind`, and `duration_frames?`. It changes each clip of the scenes row that has a clip before it. With no such clip, it returns `clip-not-found` with a hint. The result has `kind`, `duration_frames`, and `outputs` with the changed `clip_ids` of each output.
9. The default length is the frames of 0.4 seconds, rounded, and at least 1: 12 frames at 30 frames each second.
10. `get_timeline` shows `transition` with `kind` and `duration_frames` on a scene clip that has one.
11. The mark is under the "+" between two cards that touch. It shows a small picture of the kind, in the accent color for each kind other than `cut`. A click opens the line "How scene N comes in" under the cards, with the five kinds and "Close". A pick calls `set_transitions` with the `clip_ids` of the next card, so it changes each output.
12. "Between scenes" is a row of the group "This video" in Settings, after the row "Look". It shows the kind of the whole video. When the scenes change in different ways, no kind is picked and the row says so. With fewer than two scenes, the row is off and says "Add a second scene first."
13. The first request of a new project of the home server ends with the line `Between scenes: a fade from each scene to the next.`
