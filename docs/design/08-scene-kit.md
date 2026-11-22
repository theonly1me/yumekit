# 08 Scene kit

The scene kit gives an agent ready scenes, so most content needs no custom code. Package: `@yumekit/scene-kit`.

## Interface

- `kitScenes` from the main entry: one `SceneModule` for each component name. The stage page loads it in the browser.
- `paper` from the main entry: the tokens of the default style pack (colors and font family names), for custom scene code.
- `loadStylePackFonts` from the main entry: loads the fonts of a style pack. The stage page calls it before the first frame, so each scene, kit or custom, can use the fonts by name.
- `kitSceneSchemas` from the entry `@yumekit/scene-kit/schemas`: for each component name, a `purpose` text and a `zod` schema of its props. This entry has no browser code, so the harness can load it in Node.

## Rules for each kit scene

1. A scene never throws and never logs an error for bad props. It checks each field on its own and draws a default for a wrong or missing value.
2. A scene draws correctly at any clip length of 1 frame or more. If the clip is shorter than the motion, the motion runs faster and settles by 70 percent of the clip. A clip of 1 frame shows the settled picture.
3. A scene draws in the `wide`, `tall`, and `square` layouts, with all sizes in `unit`.
4. Text never leaves the picture. A scene lowers the text size until the text fits, and a long word can break.
5. A scene that shows an image draws a neutral placeholder when `findAsset` returns nothing.
6. A scene keeps its text and its values out of the caption area at the bottom (see Captions). A background or a full picture can fill it.
7. Each schema is strict. An unknown prop is a failure in the harness, with the list of valid props.
8. A scene marks each text prop that it draws with `data-text-prop` (document 02): `heading` and `subheading` of `title-card`, `heading` and `items.<index>` of `bullet-list`, `heading` and `bars.<index>.label` of `bar-chart`, `quote` and `source` of `quote`, and `caption` of `image-pan` and `video-clip`. `caption-words` has no mark, because it shows the narration one page at a time. The value of a bar has no mark, because it is a number.

## Scenes in milestone 1

| Name            | What it shows                                                                                                     | Props                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `title-card`    | A large heading, an optional smaller line, and one accent circle that grows in                                    | `heading`, `subheading`                         |
| `bullet-list`   | A heading and 1 to 6 items that appear one after another                                                          | `heading`, `items`                              |
| `image-pan`     | One image that fills the picture, cut to its shape, with a slow move across it and an optional caption at the top | `assetId`, `caption`, `direction`               |
| `caption-words` | The words of a narration, each one shown from the frame it is spoken                                              | `assetId`, `text`                               |
| `bar-chart`     | A heading and 1 to 8 bars that grow, each with a label and a value                                                | `heading`, `bars`, `valuePrefix`, `valueSuffix` |
| `quote`         | A sentence that appears word by word, with an optional source line                                                | `quote`, `source`                               |

`direction` of `image-pan` is `left`, `right`, `up`, `down`, `in`, or `out`. The default is `in`.

## Captions

`caption-words` is an overlay. Its background is transparent, and the words sit on a panel at the bottom of the picture. Put it on a scene track above the scene it describes.

The panel must read on any scene, also on a paper background and on a photo:

- The panel is ink (`#18203a`) at 92 percent opacity, and the words are paper (`#eef1f4`).
- The words are 5 units tall in `wide` and `square`, and 5.5 units in `tall`. A page of caption words stays on one line.
- The panel sits inside the caption area, which is the bottom 16 units of the picture.

Each other kit scene keeps its content out of the caption area. So a caption never covers a heading, a list, or a value. A custom scene should do the same, and the scene guide says so.

The scene reads the word timings of the speech asset. Frame 0 of the scene is frame 0 of the asset. So a caption clip must match its audio clip:

- The caption clip has the same `startFrame` and `durationFrames` as the audio clip.
- `sceneStartFrame` of the caption clip equals `assetStartFrame` of the audio clip.

The harness tool `place_narration` (document 05) makes both clips in one call, so an agent does not set these values by hand.

With no word timings, the scene spreads `text` evenly over the clip.

## The `paper` style pack

A style pack is one module of tokens that each scene reads. `paper` is the only pack in milestone 1. A second pack must need no change to the scenes.

| Token  | Value     | Use                                             |
| ------ | --------- | ----------------------------------------------- |
| Paper  | `#eef1f4` | Background                                      |
| Ink    | `#18203a` | Text                                            |
| Lamp   | `#f2b33d` | The accent circle, and the rule under a quote   |
| Sakura | `#e891ab` | First bar                                       |
| Asagi  | `#4db6ae` | Bullets, and the second bar                     |
| Fuji   | `#a294e0` | Third bar. Bars then repeat sakura, asagi, fuji |

- Headings and large text use Zen Maru Gothic 700. Items, labels, captions, and small lines use Zen Kaku Gothic New 500.
- Both fonts have the SIL Open Font License. The package bundles the Latin subset as WOFF2 files with each license file. A scene loads its fonts in `mount`, before the first frame.
- Text in another script, such as Japanese, falls back to a system font in milestone 1.
- Text rises a short distance while it fades in, over about 14 frames at 30 frames each second. Items stagger by about 20 frames. Motion lengths are converted to the frame rate of the project.
- Content is left aligned with a margin of about 8 units. A block of body text is never centered.

### Text sizes and layout

One unit is 1 percent of the shorter side of the picture. A wide picture is 177.8 units by 100. A tall picture is 100 units by 177.8. Each size in this table is a font size in units, before a scene lowers it to fit long text.

| Text                                     | `wide` | `square` | `tall` |
| ---------------------------------------- | ------ | -------- | ------ |
| Heading of `title-card`                  | 15     | 13       | 14     |
| Sentence of `quote`                      | 13     | 12       | 12.5   |
| Heading of `bullet-list` and `bar-chart` | 12     | 11       | 12     |
| Item of `bullet-list`                    | 8      | 7.5      | 8      |
| Value of a bar                           | 7.5    | 7        | 7.5    |
| Label of a bar, subheading, source line  | 5.5    | 5        | 5.5    |
| Caption words                            | 5      | 5        | 5.5    |

The first real video showed the problem of a wide picture: one narrow column at the left, and an empty right half. So a wide picture uses two columns, and a tall or square picture uses one.

Wide layout:

- The margin is 8 units on each side, so the content area is 161.8 units wide.
- `bullet-list` and `bar-chart` have two columns. The heading is in the left column, 62 units wide. The items or the bars are in the right column, which starts 78 units from the left edge and runs to the right margin.
- The heading and the right column are centered on the same horizontal line, between the top margin and the caption area.
- A bar track uses the full width of the right column. The longest bar fills 80 percent of it, so its value fits beside it.
- The sentence of `quote` can be up to 130 units wide. It is centered between the top margin and the caption area.
- `title-card` keeps its heading at the lower left, above the caption area, up to 120 units wide.

Tall and square layout:

- One column from margin to margin. The heading is above the items or the bars.
- The content block is centered between the top margin and the caption area. `title-card` keeps its heading at the lower left.

In each layout:

- A bar is 8 units tall. A bullet dot is 0.45 of the item size. The space between two items is 0.55 of the item size.
- A heading breaks into balanced lines. A heading of two short words stays on one line when it fits its column.

## Not in milestone 1

- More scenes: a map, a timeline, a comparison, a code block, a lower third, and a transition.
- A second style pack, and a way for a project to choose one.
- Bundled fonts for scripts other than Latin.
