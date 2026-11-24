# @yumekit/scene-kit

Ready scene components and style packs. Documents 01 and 02 in `docs/design` are the design.

## Interface

- `kitScenesOf(look)` from `@yumekit/scene-kit`: a `SceneModule` for each kit scene in a look, keyed by its component name. It runs in the browser. `kitScenes` gives the `paper` scenes.
- `stylePacks` and `stylePackOf(look)`: the style pack of each look.
- `useStylePack()`: the style pack in a scene. In a custom scene, it is the pack of the look that the stage page activates with `activateLook(look)`.
- `paper`: the tokens of the `paper` style pack, for old custom scenes.
- `loadStylePackFonts(stylePack)`: loads the fonts of a style pack. The stage page calls it before the first frame.
- `kitSceneSchemas`, `lookIds`, and `looks` from `@yumekit/scene-kit/schemas`: the purpose and the `zod` props schema of each kit scene, and the id, the label, and one line for each look. This entry has no browser code, so Node code can load it.

| Component       | What it shows                                                     |
| --------------- | ----------------------------------------------------------------- |
| `title-card`    | A large heading, an optional smaller line, and one accent shape   |
| `bullet-list`   | A heading and 1 to 6 items that appear one after another          |
| `image-pan`     | One image with a slow pan or zoom, and an optional caption        |
| `caption-words` | The words of a narration, each from the frame where it is spoken  |
| `bar-chart`     | A heading and 1 to 8 bars that grow, each with a label and value  |
| `quote`         | A sentence that appears word by word, with an optional source     |
| `video-clip`    | One video asset that fills the picture, and an optional caption   |
| `hero`          | A headline word by word, with a line drawn under one word         |
| `stat`          | One large number that counts up and lands with a pulse            |
| `compare`       | Two sides with a title and the same rows, the new side wins       |
| `steps`         | 2 to 5 numbered steps, joined by a line that draws                |
| `chat`          | A typed request and the answer, as two bubbles                    |
| `device`        | A picture or a video in a browser window or a phone               |
| `split`         | A picture or a video on one half and a heading on the other       |
| `logo-reveal`   | A name and a logo in a ring that draws                            |
| `checklist`     | A heading and items that get a check one after another            |
| `end-card`      | A closing line, a button, and an address                          |
| `lower-third`   | An overlay with a name and a role above the captions              |
| `kinetic`       | 1 to 4 short lines, one at a time, as large as the picture allows |
| `footage`       | A region of a recording or a picture, large, with a heading       |
| `wall`          | 2 to 16 videos or pictures as an even grid                        |
| `shapes`        | One to three videos in their own shapes, in step                  |
| `lines`         | 1 to 4 short lines, one on each beat, the old ones dimmed         |
| `look-swap`     | One video for each look, cut on the beat                          |
| `command`       | A wordmark and a command that types itself in a pill              |
| `counts`        | 1 to 3 numbers that count up next to their labels                 |

The last seven are the film scenes of document 19. They share one layout grid and one type scale, so two of them next to each other read as one film.

A scene treats its props as untrusted input. It draws a default for a missing or wrong value and never throws.

## Looks

A look is a style pack: the colors, the fonts, the backdrop, the motion, and the sizes. Each scene reads its tokens, so a new pack needs no change to the scenes. The looks are `midnight`, `studio`, `editorial`, `neon`, and `paper` (document 17 in `docs/design`).

The bottom 16 units of the picture are the caption area. `caption-words` draws the words on the caption panel of the look inside it, and each other scene keeps its text above it.

## Fonts

The `fonts` folder holds the Latin subsets of the fonts of each look as WOFF2 files from Google Fonts: Zen Maru Gothic (700), Zen Kaku Gothic New (500), Bricolage Grotesque (700), Inter (500), Inter Tight (800), Fraunces (600), DM Sans (500), and Space Grotesk (700 and 500). Each uses the SIL Open Font License 1.1. The license files are next to the fonts.

## Tests

The scene tests run in Chromium through Vitest browser mode. Install the browser once:

```sh
pnpm --filter @yumekit/scene-kit exec playwright install chromium
```
