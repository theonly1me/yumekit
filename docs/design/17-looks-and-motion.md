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
4. Things come in one after another, never all at once. Use `sequence` for the start frames, not numbers that you write by hand. A stagger is 3 to 6 frames at 30 frames each second for small things, and 8 to 12 for lines of text.
5. Nothing is still. The backdrop drifts, and the main thing moves a little for the whole scene. Use `drift`.
6. Text is large. A headline uses 60 to 80 percent of the width. A viewer reads on a phone.
7. A number counts up. A list builds. A comparison shows the old side first.
8. Take each color and each font from the look. Keep the caption area free.
9. Each platform shape gets its own layout: stack in tall, side by side in wide. Text stays left aligned in each layout.
10. Check each scene with `preview_scenes` in each output: at the frame after it settles, and at one frame during its entry.

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

## Details of WP49

1. A motion function takes its start as a frame of the clip and its length in seconds. `framesPerSecond` converts the seconds, so a motion has the same length at each frame rate.
2. The entry adds `paceFrame`. It gives the frame that a kit scene passes to the other functions: the same frame when the motion settles by 70 percent of the clip, a faster frame in a shorter clip, and the settled frame in a clip of 1 frame. `holdSplit` holds the 70 percent rule.
3. The curves: an entry uses `cubicBezier(0.16, 1, 0.3, 1)`, `draw` uses `cubicBezier(0.65, 0, 0.35, 1)`, and `exit` uses `cubicBezier(0.7, 0, 0.84, 0)`. `pop` and `scale` use a spring with an overshoot of about 10 percent, and give the exact end value at the end of their length.
4. `drift` moves on each frame of the clip and rests at the last frame. Its total move is small: a scale of 4 percent, a move of 2.5 units, or a turn of 1.2 degrees, and at most a third of that each second. So the last frame of a scene equals its settled picture, and a transition starts from a steady picture.
5. The scene contract gives a scene no id. So a kit scene uses its props as the seed of its backdrop, and two scenes with different props get different glows. A custom scene gives `Backdrop` its own `seed`.
6. `Backdrop` takes `kind`, `seed`, and `stylePack`, and each one is optional. With no pack, it uses the pack of the kit scene, then the look of the page (`useStylePack`). The kit draws it for each scene that paints its own background. `caption-words` is an overlay, so it draws no backdrop, and its words stay still so that a viewer can read them.
7. No backdrop uses a CSS filter. Each moving backdrop paints one canvas from the frame: `glow` paints two radial gradients at one eighth of the size, which the page scales up, `grid` paints its lines at full size, in the accent of the look at 55 percent, below a horizon at 60 percent of the height with a soft glow of the second glow color, and `grain` paints its noise once from the seed. A canvas keeps each frame the same in any order of seeks, also on the first frame of a clip. A render of 90 full size frames takes no longer with each backdrop than with a still CSS gradient, because most of the time goes to the encoding of a picture that is not flat.
8. Each function takes `calm`. No pack and no project has a field for it yet: WP48 left it to WP49 (its item 18), and a field of the project and of `set_look` is a change of the project format. So the kit scenes pass no `calm` in WP49. The next step adds `calm` to the project and to `set_look`, and `useKitMotion` passes it.
9. The pack keeps its `motion` fields. A kit scene reads `riseFrames`, `staggerFrames`, and `wordStaggerFrames` as frames at `referenceFramesPerSecond`. The motion that all looks share now has 18, 8, and 3: entries are a little longer and the stagger is much shorter. `settleShareOfClip` is no longer read, because `holdSplit` holds the rule.
10. A heading that is fully in shows as plain text, and a quote shows its word spans, as before WP49. So the last frame of each `paper` scene draws the same pixels as before.
11. `image-pan` moves its picture on the curve `cubicBezier(0.3, 0.15, 0.7, 0.85)`, so the picture moves at the first and at the last frame.
12. `@yumekit/scene-kit/motion` is a permitted import of a custom scene.
13. A text with `data-text-prop` keeps the mark on the one element that holds the whole text of the prop, and the word spans of `words` sit inside it. While a person edits such a text in the preview, the page shows the element, its word spans, and its parents at full opacity, with no filter and no clip, and the element and its word spans with no transform. So a heading that still comes in shows each word, and the saved text is the whole new text.

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

## Details of WP52

1. `get_scene_guide` has the part "Motion design" after "The caption area". It holds the ten rules, the steps that fit a motion to the clip with `paceFrame`, the signature of each function of `@yumekit/scene-kit/motion` with one line on its use, and `Backdrop`. A test compiles a scene that calls each function with each option that the guide names, so a signature of the guide cannot drift from the code.
2. `preview_scenes` takes `frame?`: a frame of the clip of 3 seconds that it draws. The default stays the frame 75% into it. A frame past the end gives the last frame. Rule 10 needs a frame during the entry, and the tool gave only the settled frame. `frame` 10 is during the entry at each frame rate of the project.
3. The guide has three examples. Example 1 is the full example of this document: a headline that comes in word by word, a line drawn under one word, and points that build, with `Backdrop`, `words`, `draw`, `sequence`, `drift`, and `paceFrame`. The two older examples now follow the rules too: the number uses `countUp`, `enter`, `pulse`, `drift`, and `Backdrop`, and the steps use `sequence`, `enter`, `drift`, and `Backdrop`. Their props do not change.
4. A custom scene gives `Backdrop` a fixed seed, for example its scene id, because the scene contract gives a scene no id. The content sits in a second element with `position: absolute`, because `Backdrop` is absolute and covers an element that is not positioned.
5. A settled `MotionStyle` has `transform: "none"`, so the guide says to put each motion on its own element and never to join two transform strings.
6. The scene guide names `@yumekit/scene-kit/motion` as a permitted import, and the hint of `scene-import-not-permitted` names it too. Document 02 has the same list.
7. The AI in the chat gets three rules, after rule 11: 12 (prefer a kit scene, and follow Motion design for scene code), 13 (check each new scene with `preview_scenes` at frame 10 and settled), and 14 (one call of `set_transitions` for the whole video). Rule 2 (read the guide before the first scene) stays. Step 3 and step 7 of the server instructions say the same.
8. Rules 4, 9, and 10 got one sentence each from a real run with a small model. With the guide of `main`, the AI wrote a scene that compiled at the first try and used the look, but used no motion function, no backdrop, four accent colors, and no `data-text-prop`, and its settled preview showed a clock that had not settled. With Motion design, the same request gave a scene that compiled at the first try with `Backdrop`, `paceFrame`, `enter`, `drift`, one accent, `data-text-prop`, and a stacked tall layout, and the AI checked it with `preview_scenes` at frame 10 and settled. It still wrote its start frames by hand, centered the text in tall, checked the entry only in wide, and its drawn arc showed a dot at the start. The rules now say so, and `draw` says to draw a line only when its share is above 0.02.

## Details of WP50

1. Each new scene has a folder in `packages/scene-kit/src/scenes/` with its component and its prop reader. The parts that two or more scenes share are in `src/kit/`: `Kicker` (a short line in capitals after a drawn accent line), `CheckMark` and `CrossMark`, `MediaFill` (an image or the pictures of a video asset that fill a box, with the placeholder color when the asset is missing), and `accentColors`. `useKitMotion` gets `wordsFrom`, which gives the `words` of a text with the motion values of the pack.
2. A scene uses one accent. A text in the accent uses the first accent with a contrast of 3 to 1 or more on the background, which is the rule for large text. When no accent passes (`paper`), the text keeps the text color and only the marks (lines, rings, check boxes) use the accent. A text on an accent fill uses the background color or the text color, the one with the higher contrast.
3. The pack gets two text roles: `number` (the number of `stat`: 46, 30, and 42 units in wide, square, and tall) and `statement` (a line of `kinetic`: 24, 19, and 20). The other sizes come from the roles of document 08: `hero` and `end-card` use 1.2 and 1.1 times `title`, `logo-reveal` 1.15 times `title`, `steps` 0.9 times `item` in wide and 1.05 times in tall, `chat` 0.9 and 0.95 times `item`, the rows of `compare` 0.9 times `item` (0.82 in tall), and `split` and `steps` use `heading` for their heading. A test measures each of them in wide and in tall.
4. Each scene has its own wide and tall layout. In wide, `stat`, `compare`, `steps`, `device`, `split`, `logo-reveal`, and `checklist` put their parts side by side. In tall, they stack. Square uses the side by side layout for `compare` and `split`, and the stacked layout for the others. A square picture can lower its text size to fit, so the test of sizes checks wide and tall.
5. `FitBox` lowers the text size by the share of the width too, when a text is wider than its box. The number of `stat` and a line of `kinetic` never break inside a word, so they need it. The old scenes break a long word, so they never had a text wider than its box, and their pixels do not change.
6. The slow drift of each scene grows from the bottom edge of its content, so a growing scene never moves text into the caption area. An element that comes in from the side moves from the left, because a move past the right edge counts as overflow when the fit is measured.
7. A prop with a wrong value gives these defaults: `hero` "Title", `stat` 0, `compare` "Before" and "After" with no rows, `steps` "Start" and "Finish", `chat` "Question" and "Answer", `split` and `end-card` "Title", `logo-reveal` and `lower-third` "Name", `checklist` "Point", and `kinetic` "Line". `device` shows the placeholder screen.
8. The marks `data-text-prop`: `heading` and `kicker` of `hero` (the accent word is inside `heading`); `label` of `stat` (the number has no mark); `left`, `right`, `rows.<index>.left`, and `rows.<index>.right` of `compare`; `heading` and `steps.<index>`; `request`, `answer`, `names.request`, and `names.answer`; `caption` of `device`; `heading` and `body` of `split`; `name` and `tagline`; `heading` and `items.<index>` of `checklist`; `heading`, `action`, and `handle`; `name` and `role`; and `lines.<index>`. While the request of `chat` is typed, its mark holds the typed part, and the bubble keeps the room of the whole text.
9. `device` and `split` take an image or a video. Their `assetId` has `assetKinds: ["image", "video"]` in the JSON Schema, next to `assetKind` of the other scenes. A video shows with `VideoFrame` of document 09. A prop can have `title` in the JSON Schema, and the scene form uses it as the label: `frame` of `device` is "Device", and the logo, the voice, the button, the address, and the two affixes of `stat` get plain labels. The form shows one asset field for two kinds, and a list item with only text fields (the rows of `compare`) shows its fields one under the other.
10. `kinetic` with a speech asset starts line `n` at the start frame of the spoken word whose number is the count of the words of the lines before it. The lines then follow the voice and are not paced, and a clip of 1 frame shows the last line. With too few spoken words or with no asset, the lines come in at an even pace that settles by 70 percent of the clip. Only the line of the frame and the line that leaves are drawn.
11. `device` has no `frame` by default: a browser window in wide and square, and a phone in tall. It comes in from below with a tilt back and to the side, and settles flat. A band of light crosses the screen while it settles.
12. `lower-third` is an overlay with no backdrop, like `caption-words`. Its panel has the caption panel colors of the look, so it reads on any picture, and it sits 3 units above the caption area at the left margin. It has no exit, because the last frame of each scene is its settled picture.
13. The detail that a person remembers: `hero`, the line that draws under the accent word and a small pulse of the word; `stat`, the count that lands with a pulse and a short glow; `compare`, the old side that comes first in muted colors with crosses, then the new side that pops in with the accent and draws its checks; `steps`, the line that draws from each step to the next, and the circle that fills when the line arrives; `chat`, the cursor of the typed request, the three dots, and the answer word by word; `device`, the tilt and the band of light; `split`, the accent seam that draws, and the picture that opens from it while it zooms out; `logo-reveal`, the ring that draws, the mark that pops in it with a second ring that grows and fades, and the name that comes out from beside the mark; `checklist`, the boxes that fill and draw their check one after another; `end-card`, the button with a band of light and a small press; `lower-third`, the accent bar that grows and the panel that opens from it; `kinetic`, one large line at a time, with the last line in the accent.

## Details of the explainer video

The owner judged this film on 2026-11-24 as not good enough to show, and it left the repository. Document 19 records the comparison that followed and what yumekit must gain before a new film.
