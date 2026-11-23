export const contractSection = `# Custom scene guide

Prefer a kit scene (list_kit_scenes). Write custom code only when no kit scene can show the idea.

## The contract

1. A custom scene is one TSX file. Send it as \`code\` to put_scene, with \`props\`. The harness checks it before it stores it.
2. The default export is a SceneModule. Make it with \`defineReactScene(component)\`. The component gets \`{ props }\`: the JSON object that you gave to put_scene.
3. Treat each prop as untrusted. Check its type with \`typeof\` or \`Array.isArray\`, and give a default for a missing or wrong value. You may read a prop as \`props.title\`.
4. A scene may import only \`react\`, \`@yumekit/scene\`, \`@yumekit/scene-kit\`, \`@yumekit/scene-kit/motion\`, and the shared code of the project as \`./_shared/<name>\`. Any other import fails with scene-import-not-permitted. Most scenes import \`@yumekit/scene\`, \`useStylePack\` and \`Backdrop\` from \`@yumekit/scene-kit\` for the look, and the motion functions from \`@yumekit/scene-kit/motion\` (see Motion design).
5. The code compiles with strict TypeScript. A type error fails with scene-compile-failed and gives the line and the column.
6. The scene draws inside an element with the exact size of the output in CSS pixels. Use \`position: "absolute", inset: 0\` on the root element to fill it.
7. The picture of a frame depends only on the frame number. The same frame always gives the same pixels, and frames can be drawn in any order.
8. The scene must draw correctly for any clip length of 1 frame or more. Fit the motion into \`durationFrames\`, for example settle by 70 percent of it.
9. Size all text and spacing in \`unit\`, so the scene reads the same at each output size. Keep text short: a custom scene does not shrink text to fit.
10. Put \`data-text-prop\` with the name of the prop on the element that shows a text prop, for example \`<h1 data-text-prop="title">{title}</h1>\`. A person can then click the text in the preview and change it. For a text in a list, use the path, such as \`items.0\` or \`steps.1.label\`.
11. Write code that two or more scenes need (a theme, a helper, a small component) once, with put_shared_code. Each scene imports it as \`./_shared/<name>\`, and shared code imports other shared code as \`./<name>\`. Never copy the same code into each scene.

## Hooks and components from @yumekit/scene

- \`useFrame(): number\`. The frame of the scene. 0 is the first frame of the scene, and the last is \`durationFrames - 1\`.
- \`useSceneContext()\` returns:
  - \`output: { id: string; widthPixels: number; heightPixels: number }\`
  - \`framesPerSecond: number\`
  - \`durationFrames: number\`: the length of the scene in frames.
  - \`beatFrames: number | undefined\`: the frames of one beat at the tempo of the project (set_tempo), and undefined with no tempo. It can be a fraction, for example 14.0625. In a scene that starts on a beat, beat n is at frame \`Math.round(n * beatFrames)\`.
  - \`layout: "wide" | "tall" | "square"\`: wide when width / height is 1.2 or more, tall when it is 0.8 or less.
  - \`unit: number\`: 1 percent of the shorter side, in pixels.
  - \`findAsset(assetId: string): SceneAsset | undefined\`. A SceneAsset is \`{ url: string; kind: "image" | "audio" | "video" | "font"; widthPixels?: number; heightPixels?: number; durationFrames?: number; words?: { text: string; startFrame: number; endFrame: number }[]; framePictures?: { urlPrefix: string; count: number } }\`. Use \`url\` of an image as the \`src\` of an \`<img>\`. A video asset has \`framePictures\`: one picture for each project frame, at \`urlPrefix + n + ".jpg"\`. If it returns undefined, draw a placeholder. Never fail.
- \`useHold(): { release: () => void }\`. The frame waits until you call \`release\`. You rarely need it: fonts and \`<img>\` elements already make the frame wait.
- \`<VideoFrame assetId={id} assetFrame={n} fit?={"cover" | "contain"} focus?={{ x, y }} />\`. Draws frame n of a video asset as one \`<img>\` that fills its parent. An assetFrame below 0 shows frame 0, and an assetFrame at or past \`framePictures.count\` shows the last frame. A number that is not whole rounds down. fit is cover by default. focus is the point that stays visible when cover cuts the picture, each value from 0 to 1, and the center by default. Check with findAsset that the asset is a video first, because VideoFrame throws for an asset that is missing or is not a video.
- \`<FrameWindow startFrame={n} durationFrames={m}>\`. Shows its children only from frame n for m frames (to the end when m is missing). Inside it, \`useFrame()\` starts at 0. Use it to start a part of the scene later.

## Animation functions from @yumekit/scene

Each function is pure. All frames are scene frames.

- \`tween({ frame, startFrame, endFrame, from, to, easing? }): number\`. Returns \`from\` up to startFrame and \`to\` from endFrame. The default easing is \`easings.easeInOut\`.
- \`spring({ frame, startFrame, framesPerSecond, from, to, stiffness?, damping?, mass? }): number\`. Defaults: stiffness 100, damping 10, mass 1. Returns \`from\` up to startFrame. Damping 10 overshoots a little; damping 20 or more does not overshoot.
- \`stagger({ index, startFrame, eachFrames }): number\`. The start frame of item \`index\` of a list: startFrame + index * eachFrames.
- \`easings.linear\`, \`easings.easeIn\`, \`easings.easeOut\`, \`easings.easeInOut\` (the CSS curves), and \`easings.cubicBezier({ x1, y1, x2, y2 })\`. Each easing maps progress 0 to 1 to a value.
- \`seededRandom(seed: string): () => number\`. A random function that gives the same numbers for the same seed. Make it inside the component with a fixed seed.

To convert seconds to frames, multiply by \`framesPerSecond\` from useSceneContext.
`;

export const rulesSection = `## What a scene must not do

| Not permitted | Use this |
| --- | --- |
| \`Date\`, \`performance.now\` | The frame from \`useFrame\` |
| \`Math.random\` | \`seededRandom\` |
| \`setTimeout\`, \`setInterval\`, \`requestAnimationFrame\` | A value computed from the frame |
| CSS \`animation\` and \`transition\` | \`tween\` and \`spring\` |
| \`useEffect\` or state that changes the picture | A value computed from the frame |
| A network request, or a URL from the internet | An asset from \`findAsset\` |
| Audio playback | An audio clip on the timeline |
| A \`<video>\` element (put_scene rejects it with scene-compile-failed) | \`VideoFrame\` with the id of a video asset |
| A font from the internet, or a font file in the code | The fonts of the look from \`useStylePack().fonts\`, or a font of the project from set_fonts, by its family name |

## The look

The project has a look: its colors, its fonts, and its backdrop. The person picks the look, and each kit scene follows it. A custom scene must take each color and each font from the look, so a change of the look changes the custom scene too. Call \`useStylePack()\` inside the component:

\`\`\`tsx
import { useStylePack } from "@yumekit/scene-kit";

const stylePack = useStylePack();
\`\`\`

| Token | Use |
| --- | --- |
| \`stylePack.colors.background\` | Background |
| \`stylePack.colors.surface\` | A card or a panel on the background |
| \`stylePack.colors.text\` | Text |
| \`stylePack.colors.mutedText\` | A smaller second line |
| \`stylePack.colors.accent\` | The one accent shape of a scene |
| \`stylePack.colors.accents\` | Four accent colors, for the items of a series |
| \`stylePack.colors.bars\` | The items of a series, in this order |
| \`stylePack.colors.bullet\` | Bullets |
| \`stylePack.colors.placeholder\` | An empty image area |
| \`stylePack.fonts.display.family\` | Headings and large text, at weight \`stylePack.fonts.display.weight\` |
| \`stylePack.fonts.body.family\` | Items, labels, and small lines, at weight \`stylePack.fonts.body.weight\` |
| \`stylePack.cornerUnits\` | The corner radius of a bar or a card, in units |

The stage loads the fonts of the look before the first frame, so a custom scene can name them in \`fontFamily\`. Do not set a color or a font that the look does not have, unless the person asks.

## The caption area

The bottom 16 units of the picture are the caption area. Narration captions (\`caption-words\`) draw there, above your scene. Keep all text and values of the scene above it: give the root element a bottom padding of at least 24 units, because text rises from below while it fades in. A background or a full picture can fill the caption area.

- Margin: 8 units. Content is left aligned. Never center a block of body text.
- Text sizes: a title 13 units, a heading 11 units, a list item 7.5 units, a label 5 units. In the tall layout, make text about 1.25 times larger.
- Motion: use the functions of Motion design. They take seconds, so a motion has the same length at each frame rate.
`;
