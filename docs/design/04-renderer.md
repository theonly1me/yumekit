# 04 Renderer

The renderer turns one output of a project into pictures and video files. Packages: `@yumekit/stage` (browser) and `@yumekit/render` (Node).

## Stage

The stage draws one output at one frame. The renderer and the editor preview both use it, so a preview and a render show the same picture.

```ts
type StageProject = {
  framesPerSecond: number;
  output: SceneOutput;
  scenes: { id: string; props: JsonObject }[];
  sceneTracks: SceneClip[][];
  assets: { [assetId: string]: SceneAsset };
};

function createStage(options: {
  element: HTMLElement;
  project: StageProject;
  loadScene: (sceneId: string) => Promise<SceneModule>;
  mode: "render" | "preview";
}): { seek: (frame: number) => Promise<void>; dispose: () => void };
```

On `seek(frame)` the stage does these steps:

1. It finds the visible clip of each scene track.
2. It mounts each scene that became visible and disposes each scene that is no longer visible.
3. It calls `seek` on each visible scene with the frame inside its clip, and waits for all of them.

In `render` mode the stage applies the guards from document 02: a fixed clock, a seeded `Math.random`, no CSS animations or transitions, and no network.

## Interface of the renderer

```ts
type RenderScale = 0.25 | 0.5 | 1;

function renderFrame(options: {
  folder: string;
  outputId: string;
  frame: number;
  scale?: RenderScale;
}): Promise<
  Outcome<
    { png: Uint8Array; widthPixels: number; heightPixels: number },
    RenderFailure
  >
>;

function renderVideo(options: {
  folder: string;
  outputId: string;
  destination: string;
  firstFrame?: number;
  frameCount?: number;
  scale?: RenderScale;
  onProgress?: (progress: { framesDone: number; frameCount: number }) => void;
}): Promise<
  Outcome<
    { file: string; frameCount: number; durationSeconds: number },
    RenderFailure
  >
>;
```

```ts
function checkSceneCode(options: {
  sceneId: string;
  code: string;
}): Promise<Outcome<{ checked: true }, RenderFailure>>;
```

`checkSceneCode` compiles the code of a custom scene and checks its imports. It starts no browser. The harness calls it before it stores a module scene.

- `scale` changes only the pixel density. The layout is the same at each scale. At 0.25, a 1920 by 1080 output gives a 480 by 270 picture. Use it for fast checks.
- A caller gives a folder and gets a file. The caller never starts a browser, a bundler, or FFmpeg.

## Steps of a render

1. Open the project with `openProject`. If it fails, return `project-invalid`.
2. Start a Vite server on a free localhost port. It serves the stage page, the kit scenes, each `scene.tsx`, and the asset files. It rejects an import that document 02 does not permit.
3. Start headless Chromium. Set the viewport to the output size and the device scale factor to `scale`. Block each request that does not go to the Vite server.
4. Run the repeat check (below).
5. For each frame in order: call `seek`, take a PNG screenshot of the stage element, and write it to the standard input of FFmpeg.
6. Close the input. Wait for FFmpeg to exit. Stop the browser and the server, also after a failure.

## Encoding

Video: H.264, `yuv420p`, constant rate factor 18, with `-movflags +faststart`. The frame rate is the frame rate of the project. The container is MP4.

Audio: FFmpeg reads each audio clip of the output as an input. For each clip it trims to `assetStartFrame` and `durationFrames`, delays to `startFrame`, and applies `gainDecibels`. It mixes all clips with no automatic level change. The audio codec is AAC at 192 kbit/s, 48 kHz, stereo. An output with no audio clip gets no audio stream.

A render of a frame range includes only the audio inside that range.

## Repeat check

Before a video render, the renderer draws the first frame and the middle frame two times each, in the order first, middle, middle, first. If the two pictures of a frame differ, it returns `scene-not-repeatable` with the scene ids that were visible. This costs 4 frames and catches a scene that reads a clock or depends on call order.

## Failures

`RenderFailure` is `{ kind, message, hint? }` plus the fields below.

| Kind                         | Extra fields                | When                                                                      |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `project-invalid`            | the open failure            | The project does not open                                                 |
| `output-not-found`           | `outputId`                  | No output has that id                                                     |
| `frame-out-of-range`         | `frame`, `frameCount`       | The frame or the range is outside the output                              |
| `browser-not-installed`      |                             | Chromium is missing. The hint gives the install command                   |
| `ffmpeg-not-found`           |                             | `ffmpeg` is not on the `PATH`. The hint gives install commands            |
| `scene-import-not-permitted` | `sceneId`, `importName`     | Scene code imports a package that is not permitted                        |
| `scene-compile-failed`       | `sceneId`, `line`, `column` | Scene code has an error that stops the bundler                            |
| `scene-error`                | `sceneId`, `frame`          | Scene code threw, or logged an error, or `seek` took more than 30 seconds |
| `scene-not-repeatable`       | `sceneIds`, `frame`         | The repeat check failed                                                   |
| `encode-failed`              | `stderrTail`                | FFmpeg exited with an error                                               |

## Tests

The tests use real Chromium and real FFmpeg. They do not compare against stored pictures, because fonts and graphics differ between machines.

1. A test scene draws a square that moves with the frame. The test reads pixels of rendered frames and checks the position of the square at 3 frames.
2. The same frame rendered two times gives identical bytes.
3. A scene that uses `Math.random` without the guard, or that depends on call order, fails with `scene-not-repeatable`.
4. A rendered video has the expected size, frame count, and frame rate. The test reads them with `ffprobe`.
5. A project with a tone at a known time gives a video with an audio stream. The decoded audio is silent before the clip and not silent inside it.
6. Each failure kind in the table has a test that triggers it.

CI installs Chromium with Playwright and installs FFmpeg.

## Not in milestone 1

- Parallel render workers and faster capture. Each pull request that touches the renderer reports frames per second for the test project, so later work has a baseline.
- Formats other than MP4 and PNG.
- Hardware graphics. Milestone 1 does not promise repeatable WebGL pictures.
