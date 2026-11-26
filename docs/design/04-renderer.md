# 04 Renderer

The renderer turns one output of a project into pictures and video files. Packages: `@yumekit/stage` (browser) and `@yumekit/render` (Node).

## Stage

The stage draws one output at one frame. The renderer and the editor preview both use it, so a preview and a render show the same picture.

```ts
type StageProject = {
  framesPerSecond: number;
  beatFrames?: number;
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
3. It calls `seek` on each visible scene with the frame `f - startFrame + sceneStartFrame`, and waits for all of them.

The stage mounts a scene with `durationFrames` equal to `sceneStartFrame` plus the length of its clip.

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

function renderSceneFrame(options: {
  folder: string;
  outputId: string;
  sceneId: string;
  durationFrames: number;
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
  smallerFile?: { largestMegabytes: number; shortSidePixels?: number };
  onProgress?: (progress: { framesDone: number; frameCount: number }) => void;
}): Promise<
  Outcome<
    {
      file: string;
      frameCount: number;
      durationSeconds: number;
      widthPixels: number;
      heightPixels: number;
    },
    RenderFailure
  >
>;
```

```ts
function probeMedia(options: { file: string }): Promise<
  Outcome<
    {
      kind: "image" | "audio" | "video";
      durationSeconds?: number;
      widthPixels?: number;
      heightPixels?: number;
    },
    RenderFailure
  >
>;
```

`probeMedia` reads the kind, the length, and the size of a media file with `ffprobe`. The harness calls it when a person imports a file. A file that `ffprobe` cannot read is the failure `media-not-readable`.

```ts
function checkSceneCode(options: {
  sceneId: string;
  code: string;
}): Promise<Outcome<{ checked: true }, RenderFailure>>;
```

`renderSceneFrame` draws one scene alone at the size of the output. It replaces the timeline with one scene track that holds one clip of the scene, from frame 0, with the length `durationFrames`. It uses the same stage page as `renderFrame`. An unknown scene id is the failure `scene-not-found`. The harness tool `preview_scenes` calls it.

`checkSceneCode` compiles the code of a custom scene and checks its imports. It starts no browser. The harness calls it before it stores a module scene. It takes `sharedCode?`, the shared code of the project, and `checkSharedCode({ name, code, sharedCode })` checks one shared module in the same way (document 19).

- `scale` changes only the pixel density. The layout is the same at each scale. At 0.25, a 1920 by 1080 output gives a 480 by 270 picture. Use it for fast checks.
- A caller gives a folder and gets a file. The caller never starts a browser, a bundler, or FFmpeg.
- `destination` is the full path of the file to write. The renderer creates its folder.
- A scaled picture can have an odd width or height, for example 1080 by 1350 at scale 0.25. `renderFrame` returns that picture as it is. `renderVideo` cuts one pixel from an odd side, because the video format needs even sides. The result reports the real size.

## Steps of a render

1. Open the project with `openProject`. If it fails, return `project-invalid`.
2. Start a Vite server on a free localhost port. It serves the stage page, the kit scenes, each `scene.tsx`, and the asset files. It rejects an import that document 02 does not permit.
3. Start headless Chromium. Set the viewport to the output size and the device scale factor to `scale`. Block each request that does not go to the Vite server.
4. Run the repeat check (below).
5. For each frame in order: call `seek`, take a PNG screenshot of the stage element, and write it to the standard input of FFmpeg.
6. Close the input. Wait for FFmpeg to exit. Stop the browser and the server, also after a failure.

## Encoding

Video: H.264, `yuv420p`, constant rate factor 18, with `-movflags +faststart`. The frame rate is the frame rate of the project. The container is MP4.

A smaller file (`smallerFile`, document 21, T15 and "Details of WP82"): the renderer makes the best file in a temporary folder, then two passes of H.264 from it at a bitrate from the size and the length, with AAC at 128 kbps and `-movflags +faststart`. It keeps the picture size, or makes the short side `shortSidePixels`.

Audio: FFmpeg reads each audio clip of the output as an input. For each clip it trims to `assetStartFrame` and `durationFrames`, delays to `startFrame`, and applies `gainDecibels`. It mixes all clips. The audio codec is AAC at 192 kbit/s, 48 kHz, stereo. An output with no audio clip gets no audio stream.

A render of a frame range includes only the audio inside that range.

Loudness (decision of WP63, document 19): the finished video aims at -14 LUFS integrated with a true peak of at most -1 dB, the level of a film on a video platform. The renderer decides it, not each media tool, because only the mix knows the music, the voice, the sounds, and the gain of each clip together. Before the encode, FFmpeg measures the mix of the whole output once with `loudnorm` (`print_format=json`): the integrated loudness and the true peak. The renderer then adds one fixed gain to the whole mix, `-14 - I`, at most 24 dB up or down, rounded to 0.01 dB. When the true peak plus the gain passes -1 dB, a limiter (`alimiter`, ceiling 0.8414, about -1.5 dBFS, attack 5 ms, release 50 ms, no auto level) follows the gain. One gain for the whole mix keeps the balance between the voice and the music. A render of a frame range uses the gain of the whole output, so a part sounds as it does in the whole video. The measure and the gain are pure functions of the files, so the same project gives the same sound on each render. A mix that is silent, or a measure that fails, keeps its level.

The audio stream has the same length as the video stream, within one frame. Silence fills each part with no clip. A test checks the length of the audio stream with `ffprobe`.

## Repeat check

Before a video render, the renderer draws the first frame and the middle frame two times each, in the order first, middle, middle, first. If the two pictures of a frame differ, it returns `scene-not-repeatable` with the scene ids that were visible. This costs 4 frames and catches a scene that reads a clock or depends on call order.

## Failures

`RenderFailure` is `{ kind, message, hint? }` plus the fields below.

| Kind                         | Extra fields                            | When                                                                                                          |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `project-invalid`            | `openFailure`                           | The project does not open                                                                                     |
| `output-not-found`           | `outputId`                              | No output has that id                                                                                         |
| `frame-out-of-range`         | `frame`, `frameCount`                   | The frame or the range is outside the output                                                                  |
| `browser-not-installed`      |                                         | Chromium is missing. The hint gives the install command                                                       |
| `ffmpeg-not-found`           |                                         | `ffmpeg` is not on the `PATH`. The hint gives install commands                                                |
| `scene-import-not-permitted` | `sceneId`, `importName`                 | Scene code imports a package that is not permitted                                                            |
| `scene-compile-failed`       | `sceneId`, `line`, `column`             | Scene code has an error that stops the bundler                                                                |
| `kit-scene-not-found`        | `sceneId`, `component`                  | A kit scene names a component that the kit does not have                                                      |
| `scene-not-found`            | `sceneId`                               | `renderSceneFrame` names a scene that the project does not have                                               |
| `scene-error`                | `sceneId`, `frame`                      | Scene code threw, or logged an error, or `seek` took more than 30 seconds. `frame` is the frame of the output |
| `scene-not-repeatable`       | `sceneIds`, `frame`                     | The repeat check failed                                                                                       |
| `media-not-readable`         | `file`                                  | `probeMedia` cannot read the file                                                                             |
| `encode-failed`              | `stderrTail`                            | FFmpeg exited with an error                                                                                   |
| `video-frames-failed`        | `assetId`, `stderrTail`                 | FFmpeg cannot make the frame pictures of a video asset. `stderrTail` is the last line of its error output     |
| `file-size-not-reached`      | `largestMegabytes`, `smallestMegabytes` | A smaller file cannot fit under the size. `smallestMegabytes` is the smallest size that yumekit can make      |

## Tests

The tests use real Chromium and real FFmpeg. They do not compare against stored pictures, because fonts and graphics differ between machines.

1. A test scene draws a square that moves with the frame. The test reads pixels of rendered frames and checks the position of the square at 3 frames.
2. The same frame rendered two times gives identical bytes.
3. A scene that uses `Math.random` without the guard, or that depends on call order, fails with `scene-not-repeatable`.
4. A rendered video has the expected size, frame count, and frame rate. The test reads them with `ffprobe`.
5. A project with a tone at a known time gives a video with an audio stream. The decoded audio is silent before the clip and not silent inside it. The audio stream is as long as the video stream, for a full render and for a frame range.
6. Each failure kind in the table has a test that triggers it.

CI installs Chromium with Playwright and installs FFmpeg.

## Faster pictures

Measured on 2026-11-22 and 2026-11-23: each preview picture starts its own browser, the Making screen asks for each picture again after each change, a large picture of the Pictures view takes 17 to 23 seconds on a CI runner, and 90 frames of a scene on a moving backdrop take 14.6 seconds where a flat scene takes 6.2 seconds. The extra time of the backdrop is the PNG encoding of each frame.

| Id  | Decision                                                                                                              | Why                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| R1  | An engine keeps one browser for its pictures: `preview_frame`, `preview_frames`, `preview_scenes`, and `render_still` | The start of a browser costs more than the picture                                     |
| R2  | One call draws each of its frames on one page                                                                         | A page load for each frame repeats the same work                                       |
| R3  | A video render takes its frames in the fastest form that loses no pixel                                               | The encoder makes the file. The PNG of a frame is thrown away                          |
| R4  | The editor asks again only for the picture of a scene that changed                                                    | A change of one scene must not draw six scenes                                         |
| R5  | An engine and a home server stop each process that they started, for each way that they end                           | A browser or a media server that stays alive is a defect on the computer of the person |

- R1: the browser starts with the first picture. It closes after 60 seconds with no picture, and when the engine closes. A project change needs no new browser: the page loads the project again. A command with no engine, such as `yumekit frame`, starts its own browser as before.
- R1: a picture that fails because the browser ended gets one new browser and one more try.
- R2 and R1 keep the repeat check of this document: a frame of a kept page equals the same frame of a new page. A test proves it for a kit scene and for a custom scene.
- R3: the builder measures the choices that the browser has for a screenshot without loss (for example the speed setting of the screenshot command of the browser protocol, and raw pixels), with 90 frames of a `glow` scene at full size. The builder takes the fastest one that gives the same decoded pixels as today. If no choice without loss is at least 1.5 times faster, the builder reports the numbers and stops this part: a form with loss is a decision of the design.
- R3 applies to `render_video` only. A still and a preview stay PNG.
- R4: the editor keeps each scene picture with a key of the scene content (its code or component, its props, the look, and the output size). It asks only for keys that it does not have.
- R5: the ways to end are the end of the command, `SIGINT`, `SIGTERM`, `SIGHUP`, and a failure that is not handled. The processes are the media servers, the browsers, the engines of a home server, and an agent program that runs. A test starts a home server with an open project, sends `SIGTERM`, and finds no process of it after 5 seconds.

Targets on the computer of the owner, each measured before and after in the pull request: a second card picture in under 1.5 seconds, the six pictures of a project after one scene change in the time of one picture, and 90 frames of a `glow` scene at full size in at most 1.5 times the time of a flat scene.

Work package WP53 holds R1 to R5.

## Not in milestone 1

- Parallel render workers and faster capture. Each pull request that touches the renderer reports frames per second for the test project, so later work has a baseline.
- Formats other than MP4 and PNG.
- Hardware graphics. Milestone 1 does not promise repeatable WebGL pictures.

## Details of WP53

1. `@yumekit/render` gets `createPictureRenderer({ folder, idleMilliseconds? })`. It returns `renderFrames({ outputId, frames, scale? })`, `renderSceneFrames({ outputId, sceneIds, durationFrames, frame, scale? })`, and `close()`. Each call gives one picture for each frame or scene, in the order given. `createHarness` and `createHarnessServer` make one for the project, and their close closes it. `preview_frame`, `preview_frames`, `preview_scenes`, and `render_still` use it. `render_video`, `renderFrame`, `renderSceneFrame`, `yumekit frame`, and `yumekit render` keep a browser for one call only.
2. The kept browser has one page for each output size and scale. Calls on one page wait for each other, so the frames of two calls never mix. Each call opens the project from disk again and gives the page its data. The page disposes the stage of the last call before it builds the new stage, so the render guards of document 02 start again for each call. `preview_scenes` loads each scene alone on the same page, one after another.
3. The stage page gets its data from the call, not from a module that the server builds. The URL of the code of a custom scene ends in a hash of the code. So a changed scene loads its new code, and an unchanged scene reuses the module that the browser has.
4. The stage page imports the code of a custom scene through a small script in the page, `window.yumekitImport`. Vite rewrites a dynamic `import()` in a module with a helper from `/@vite/client`, and the render page blocks `/@vite/client`.
5. A call that fails while the browser is not connected closes the kept browser, starts one new browser, and tries once more. Any other error closes the page of the call, so the next call opens a new page.
6. The stage removes each render guard on `dispose`, also when a scene throws in its own `dispose`. Then it throws the first error.
7. The choices for a frame without loss, measured on the computer of the owner with 90 frames of the `title-card` in the `midnight` look (glow) at 1920 by 1080, best of 3 runs, with the PNG of each frame sent to FFmpeg:

| Choice                                                           | Seconds | Decoded pixels |
| ---------------------------------------------------------------- | ------- | -------------- |
| Playwright `page.screenshot` PNG (before)                        | 9.11    | The reference  |
| `Page.captureScreenshot` PNG                                     | 9.16    | Same           |
| `Page.captureScreenshot` PNG with `optimizeForSpeed`             | 4.83    | Same           |
| `Page.captureScreenshot` WebP quality 100                        | 54.09   | Same           |
| `Page.captureScreenshot` WebP quality 100 and `optimizeForSpeed` | 14.05   | Same           |

8. Playwright 1.65.1 offers PNG, JPEG, and WebP, and no speed setting. The browser protocol has no command that returns raw pixels: `Page.startScreencast` gives JPEG or PNG only. So `render_video` takes each frame with `Page.captureScreenshot`, PNG, and `optimizeForSpeed` (1.9 times faster). The capture uses its own protocol session. An emulation setting belongs to the session that set it, so the capture gives a clip of the output in CSS pixels with the render scale as its `scale`. A test checks that this capture decodes to the pixels of the still at the scales 1, 0.5, and 0.25. The repeat check and each still keep the Playwright PNG. Four captures of each drawn frame (fast, still, fast, and a still 150 milliseconds later) gave the same pixels for 3 times 90 frames of the `midnight` title card, on a calm machine and with 12 busy processes on 16 cores. One earlier run while other heavy work ran showed a difference of about 46 pixels of a moving shape between a still and a fast capture of one drawn frame, in some frames. Later runs did not show it again.
9. The editor keeps each scene picture in one store for each engine connection, shared by the scene cards and the Pictures view. The key of a picture of a clip has the look, the frame rate, the output size, the scale, and each scene clip that the frame shows on a track that is on: its scene, its length, its start in the scene, its transition, and the frames since its start. A clip with a transition also adds the clip before it. Each scene in the key adds its kit component or code, its props, and the record of each asset that its props name. The key of a scene alone has the same parts for the one scene. A move of a scene changes no key. A picture that failed is asked for again at the next change. The store keeps the last 300 pictures.
10. The scene cards under the preview showed their pictures in a real run of the editor on a copy of the demo project. The black cards of the earlier test runs come from the editor tests, which start the engine with `PLAYWRIGHT_BROWSERS_PATH` set to an empty folder unless a test asks for Chromium.
11. `yumekit`, `yumekit open`, and `yumekit mcp` close their engine or harness, and so each media server, browser, and agent program, on `SIGINT`, `SIGTERM`, `SIGHUP`, and an uncaught error or rejected promise. `yumekit mcp` also closes at the end of its standard input, also as a bridge to an engine. If a close takes more than 20 seconds, the command exits, and Playwright stops its browsers when the process exits. Before WP53, `yumekit mcp` and its four media servers stayed alive after the end of its input, and so did a bridge. Tests start `yumekit` and `yumekit mcp` with a picture, end them, and find no process of them after 5 seconds.
