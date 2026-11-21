# @yumekit/render

Frames and video files from scenes. Document 04 in `docs/design` is the design.

## What this package owns

- `renderFrame`: one frame of an output as a PNG.
- `renderVideo`: an output, or a range of its frames, as an MP4 file with H.264 video and AAC audio.
- `probeMedia`: the kind, the length, and the size of an image, audio, or video file, read with `ffprobe`. For a video file it also gives `hasAudio`.
- `startPreviewServer`: serves the preview page of each output for the editor, with the stage in `preview` mode. The page talks to its parent window with `postMessage`. Document 11 has the messages and the origin rules.
- `checkSceneCode`: compiles the code of a custom scene with strict TypeScript and checks its imports. It rejects a `<video>` element. It starts no browser.
- Frame pictures: the Vite server serves frame `n` of a video asset at `/asset-frames/<assetId>/<n>.jpg`. FFmpeg makes the pictures on the first request and keeps them in `<project>/.cache/video-frames/`. Document 09 has the rules.
- Chromium, the Vite server, and FFmpeg stay behind this package. A caller gives a folder and gets a picture or a file.

## What a render needs

- Chromium for Playwright: `npx playwright@1.65.1 install chromium`.
- `ffmpeg` and `ffprobe` on the `PATH` for `renderVideo`, and for any render of a video asset.

## Kit scenes

The stage page loads the fonts of the `paper` style pack before the first frame, so a custom scene can name them. It reads `kitScenes` from `@yumekit/scene-kit`. A kit scene loads by its `component` name as the key of that map.

## Tests

The tests use real Chromium and real FFmpeg. Run `pnpm typecheck` first, because the tests load the built packages.
