export const contractSection = `# Custom scene guide

Prefer a kit scene (list_kit_scenes). Write custom code only when no kit scene can show the idea.

## The contract

1. A custom scene is one TSX file. Send it as \`code\` to put_scene, with \`props\`. The harness checks it before it stores it.
2. The default export is a SceneModule. Make it with \`defineReactScene(component)\`. The component gets \`{ props }\`: the JSON object that you gave to put_scene.
3. Treat each prop as untrusted. Check its type with \`typeof\` or \`Array.isArray\`, and give a default for a missing or wrong value. You may read a prop as \`props.title\`.
4. A scene may import only \`react\`, \`@yumekit/scene\`, and \`@yumekit/scene-kit\`. Any other import fails with scene-import-not-permitted. Most scenes import \`@yumekit/scene\`, and \`paper\` from \`@yumekit/scene-kit\` for colors and fonts.
5. The code compiles with strict TypeScript. A type error fails with scene-compile-failed and gives the line and the column.
6. The scene draws inside an element with the exact size of the output in CSS pixels. Use \`position: "absolute", inset: 0\` on the root element to fill it.
7. The picture of a frame depends only on the frame number. The same frame always gives the same pixels, and frames can be drawn in any order.
8. The scene must draw correctly for any clip length of 1 frame or more. Fit the motion into \`durationFrames\`, for example settle by 70 percent of it.
9. Size all text and spacing in \`unit\`, so the scene reads the same at each output size. Keep text short: a custom scene does not shrink text to fit.

## Hooks and components from @yumekit/scene

- \`useFrame(): number\`. The frame of the scene. 0 is the first frame of the scene, and the last is \`durationFrames - 1\`.
- \`useSceneContext()\` returns:
  - \`output: { id: string; widthPixels: number; heightPixels: number }\`
  - \`framesPerSecond: number\`
  - \`durationFrames: number\`: the length of the scene in frames.
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
| A font from the internet, or a font file in the code | The paper fonts from \`paper.fonts\` |

## The paper style

Import \`paper\` from \`@yumekit/scene-kit\` and read colors and fonts from it, so that a custom scene matches the kit scenes:

\`\`\`tsx
import { paper } from "@yumekit/scene-kit";
\`\`\`

| Token | Value | Use |
| --- | --- | --- |
| \`paper.colors.background\` | #eef1f4 | Background |
| \`paper.colors.text\` | #18203a | Text |
| \`paper.colors.mutedText\` | Ink at 75 percent | A smaller second line |
| \`paper.colors.accent\` | #f2b33d | Accent shape, and the rule under a quote |
| \`paper.colors.bars\` | #e891ab, #4db6ae, #a294e0 | The items of a series, in this order |
| \`paper.colors.bullet\` | #4db6ae | Bullets |
| \`paper.colors.placeholder\` | #dfe4ea | An empty image area |
| \`paper.fonts.display.family\` | Zen Maru Gothic, weight \`paper.fonts.display.weight\` (700) | Headings and large text |
| \`paper.fonts.body.family\` | Zen Kaku Gothic New, weight \`paper.fonts.body.weight\` (500) | Items, labels, and small lines |

The stage loads both fonts before the first frame, so a custom scene can name them in \`fontFamily\`.

## The caption area

The bottom 16 units of the picture are the caption area. Narration captions (\`caption-words\`) draw there, above your scene. Keep all text and values of the scene above it: give the root element a bottom padding of at least 24 units, because text rises from below while it fades in. A background or a full picture can fill the caption area.

- Margin: 8 units. Content is left aligned. Never center a block of body text.
- Text sizes: a title 13 units, a heading 11 units, a list item 7.5 units, a label 5 units. In the tall layout, make text about 1.25 times larger.
- Motion: text rises 6 units while it fades in over 14 frames at 30 frames per second. Items start about 20 frames apart. Scale these by framesPerSecond / 30.
`;
