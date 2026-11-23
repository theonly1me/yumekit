# 02 Scene contract

A scene draws itself at a given frame. The stage, the renderer, and the editor preview know only this contract. Package: `@yumekit/scene`.

## The contract

```ts
type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type SceneOutput = { id: string; widthPixels: number; heightPixels: number };

type SceneAsset = {
  url: string;
  kind: "image" | "audio" | "video" | "font";
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
  words?: SceneWord[];
  framePictures?: { urlPrefix: string; count: number };
  marks?: SceneAssetMark[];
};

type SceneRegion = { x: number; y: number; width: number; height: number };
type SceneAssetMark = { name: string; region?: SceneRegion; seconds?: number };

type SceneWord = { text: string; startFrame: number; endFrame: number };

type MountOptions = {
  element: HTMLElement;
  output: SceneOutput;
  framesPerSecond: number;
  durationFrames: number;
  beatFrames?: number;
  props: JsonObject;
  findAsset: (assetId: string) => SceneAsset | undefined;
};

type MountedScene = {
  seek: (frame: number) => Promise<void>;
  dispose: () => void;
};

type SceneModule = {
  mount: (options: MountOptions) => Promise<MountedScene>;
};
```

## Rules for `mount`

1. `element` is empty and has the exact size of the output in CSS pixels. The scene draws only inside it.
2. `durationFrames` is the length of the scene. It is `sceneStartFrame` plus the length of the clip that shows the scene. A scene must draw correctly for any length of 1 frame or more.
3. `props` come from `scene.json`. The scene treats them as untrusted input and gives a default for each missing value.
4. `words` on a speech asset are relative to the start of that asset, in frames.
5. An element that shows a text prop may carry the attribute `data-text-prop` with the path of the prop (WP33). The path joins the prop names with dots, and a list index is a whole number: `heading`, `items.0`, `bars.1.label`. The mark is an attribute only, so it adds no pixel to a frame. The editor preview uses it to change the text in place (document 13).

## Rules for `seek`

1. `frame` is a whole number from 0 to `durationFrames - 1`. Frame 0 is the first frame of the scene. A clip with `sceneStartFrame` 15 starts the scene at frame 15.
2. `seek` resolves when the picture for that frame is complete. Fonts are loaded, images are decoded, and each hold is released.
3. The stage can call `seek` with frames in any order. The picture for a frame must not depend on an earlier call.
4. Two calls with the same frame give the same pixels.

## What a scene must not do

| Not permitted                                                              | Use this                        |
| -------------------------------------------------------------------------- | ------------------------------- |
| `Date`, `performance.now`                                                  | The frame number                |
| `Math.random`                                                              | `seededRandom`                  |
| `setTimeout`, `setInterval`, `requestAnimationFrame` to change the picture | A value computed from the frame |
| CSS `animation` and `transition` in a React scene                          | `tween` and `spring`            |
| A network request                                                          | An asset from `findAsset`       |
| Audio playback                                                             | An audio clip on the timeline   |

The stage enforces these rules where it can. In render mode it fixes the clock and seeds `Math.random` from the scene id and the frame. It also turns off CSS animations and transitions, and blocks network requests. The renderer also checks that sample frames repeat (document 04).

## React adapter

```ts
function defineReactScene(
  component: (props: { props: JsonObject }) => ReactNode,
): SceneModule;

function useFrame(): number;
function useSceneContext(): {
  output: SceneOutput;
  framesPerSecond: number;
  durationFrames: number;
  beatFrames: number | undefined;
  layout: "wide" | "tall" | "square";
  unit: number;
  findAsset: (assetId: string) => SceneAsset | undefined;
};
function useHold(): { release: () => void };
```

- `layout` is `wide` when width divided by height is 1.2 or more, `tall` when it is 0.8 or less, and `square` for the rest.
- `beatFrames` is the frames of one beat at the tempo of the project (document 19), and `undefined` for a project with no tempo. It can be a fraction.
- `unit` is 1 percent of the shorter side in pixels. A scene sizes text and spacing in units, so it reads the same at each output size.
- `useHold` makes `seek` wait until the scene calls `release`. Use it for work that finishes later, such as loaded data. A hold belongs to its component. After `release`, later seeks do not wait for it. A hold stops when its component unmounts.
- An image that cannot decode makes `seek` reject. A frame outside the clip and a `seek` after `dispose` also reject, because each one is a defect in the caller.
- On each `seek`, the adapter renders the component for that frame with `flushSync`. It then waits for `document.fonts.ready`, for each image in the element to decode, and for each hold.

A helper limits a part of a scene to a window of frames:

```ts
function FrameWindow(props: {
  startFrame: number;
  durationFrames?: number;
  children: ReactNode;
}): ReactNode;
```

Inside `FrameWindow`, `useFrame` starts at 0 at `startFrame`. The children draw only while the frame is inside the window. With no `durationFrames`, the window lasts to the end of the clip.

## Animation functions

Each function is pure. The same input gives the same output.

```ts
type Easing = (progress: number) => number;

function tween(options: {
  frame: number;
  startFrame: number;
  endFrame: number;
  from: number;
  to: number;
  easing?: Easing;
}): number;

function spring(options: {
  frame: number;
  startFrame: number;
  framesPerSecond: number;
  from: number;
  to: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
}): number;

function stagger(options: {
  index: number;
  startFrame: number;
  eachFrames: number;
}): number;

function seededRandom(seed: string): () => number;

const easings: {
  linear: Easing;
  easeIn: Easing;
  easeOut: Easing;
  easeInOut: Easing;
  cubicBezier: (controlPoints: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => Easing;
};
```

- `tween` returns `from` before `startFrame` and `to` after `endFrame`. The default easing is `easeInOut`.
- `easeIn`, `easeOut`, and `easeInOut` are the CSS curves: (0.42, 0, 1, 1), (0, 0, 0.58, 1), and (0.42, 0, 0.58, 1).
- `spring` returns `from` before `startFrame`. It solves the spring equation in closed form, so frame 500 costs the same as frame 5. The defaults are stiffness 100, damping 10, and mass 1.
- `stagger` returns the start frame for item `index` of a list.

## Custom scene code

An agent writes a custom scene as one file, `scenes/<sceneId>/scene.tsx`. The default export is a `SceneModule`.

```tsx
import {
  defineReactScene,
  tween,
  useFrame,
  useSceneContext,
} from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit } = useSceneContext();
  const opacity = tween({ frame, startFrame: 0, endFrame: 20, from: 0, to: 1 });
  const title = typeof props.title === "string" ? props.title : "";
  return <h1 style={{ opacity, fontSize: 9 * unit }}>{title}</h1>;
});
```

A custom scene may import only `react`, `@yumekit/scene`, `@yumekit/scene-kit`, `@yumekit/scene-kit/motion` (document 17), and the shared code of the project as `./_shared/<name>` (document 19). Shared code may import the same packages, and other shared code as `./<name>`. The bundler rejects any other import with the failure `scene-import-not-permitted`. Custom scene code compiles with strict TypeScript, but it may read a prop as `props.title`. A later design adds a list of extra packages for a project, for example a 3D library.

## Not in milestone 1

- The HTML adapter, which seeks CSS animations and the Web Animations API.
- A `Video` component for a video file inside a scene.
- 3D scenes. The contract already permits them, because a 3D scene can set its state from the frame.
