# @yumekit/scene-kit

Ready scene components and style packs. Documents 01 and 02 in `docs/design` are the design.

## Interface

- `kitScenes` from `@yumekit/scene-kit`: a `SceneModule` for each kit scene, keyed by its component name. It runs in the browser.
- `paper` from `@yumekit/scene-kit`: the tokens of the default style pack. Custom scene code reads its colors, such as `paper.colors.text`, and its font family names, such as `paper.fonts.display.family`.
- `loadStylePackFonts(paper)` from `@yumekit/scene-kit`: loads the fonts of a style pack. The stage page calls it before the first frame.
- `kitSceneSchemas` from `@yumekit/scene-kit/schemas`: the purpose and the `zod` props schema of each kit scene. It has no browser code, so Node code can load it.

| Component       | What it shows                                                    |
| --------------- | ---------------------------------------------------------------- |
| `title-card`    | A large heading, an optional smaller line, and one accent shape  |
| `bullet-list`   | A heading and 1 to 6 items that appear one after another         |
| `image-pan`     | One image with a slow pan or zoom, and an optional caption       |
| `caption-words` | The words of a narration, each from the frame where it is spoken |
| `bar-chart`     | A heading and 1 to 8 bars that grow, each with a label and value |
| `quote`         | A sentence that appears word by word, with an optional source    |
| `video-clip`    | One video asset that fills the picture, and an optional caption  |

A scene treats its props as untrusted input. It draws a default for a missing or wrong value and never throws.

## Style pack

The `paper` style pack sets the colors, the fonts, the motion, and the sizes. Each scene reads its tokens, so a second pack needs no change to the scenes.

The bottom 16 units of the picture are the caption area. `caption-words` draws paper words on an ink panel inside it. The caption of `video-clip` uses the same panel. Each other scene keeps its text above it.

## Fonts

The `fonts` folder holds the Latin subsets of Zen Maru Gothic (700) and Zen Kaku Gothic New (500) as WOFF2 files from Google Fonts. Both use the SIL Open Font License 1.1. The license files are next to the fonts.

## Tests

The scene tests run in Chromium through Vitest browser mode. Install the browser once:

```sh
pnpm --filter @yumekit/scene-kit exec playwright install chromium
```
