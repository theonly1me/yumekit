# 09 Generated video

A generated clip is a short video file that a video model makes from a prompt, a first frame, or both. This document adds generated clips to yumekit. It covers how a scene shows a video file, how the sound of a clip gets into the mix, how a video server connects, and the limit that protects the money of the user.

Code scenes stay the base of a project. A generated clip is one more kind of scene content, next to text, charts, and images.

## Facts behind this design

The lead agent read these on 2026-11-21. A price is the price on that date.

| Provider                       | Model                    | Price for one second at 720p | Clip length  | Shapes                      | Source                                                   |
| ------------------------------ | ------------------------ | ---------------------------- | ------------ | --------------------------- | -------------------------------------------------------- |
| Google Gemini API              | `gemini-omni-1.2-flash`  | About 0.07 US dollars        | 3 to 15 s    | 16:9, 9:16                  | `aistudio.google.com/docs/pricing`, `/docs/omni`         |
| fal                            | Seedance 2.5             | About 0.47 US dollars        | 4 to 30 s    | 21:9 to 9:16, 7 shapes      | `fal.ai/models/bytedance/seedance-2.5/us/image-to-video` |
| Replicate                      | `bytedance/seedance-2.5` | Not shown on the model page  | 4 to 30 s    | Not shown on the model page | `replicate.com/bytedance/seedance-2.5`                   |
| The computer of the user (MLX) | LTX-2, Wan 2.2           | Free                         | Not measured | Not measured                | `github.com/Blaizzy/mlx-video`                           |

- Each hosted model accepts a text prompt, and a first frame image with a prompt. Each one makes sound with the picture by default.
- The Gemini API has no free tier for video.
- OpenAI shut down its video API on 2026-09-24, as several secondary sources report. The lead agent did not confirm this on an OpenAI page. So `tools/openai-media` gets no video tool.
- The BytePlus documents did not load in a plain fetch. Their prices are not confirmed.
- The `mlx-video` README gives no memory need and no speed. A probe must measure both before a local server gets a design.

## Decisions

| Id  | Decision                                                                                  | Why                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| V1  | A scene shows a video file as a row of still pictures, one for each project frame         | A `<video>` element does not seek to an exact frame, and the Chromium that Playwright installs has no H.264 decoder |
| V2  | The renderer makes those pictures on first use and keeps them in a cache folder           | A project stays small, and a second render is fast                                                                  |
| V3  | An audio clip can read the sound of a video asset                                         | The sound of a generated clip is part of what makes it real                                                         |
| V4  | yumekit bundles a video server for each provider that it supports. Document 10 lists them | The person chooses the model. `tools/gemini-media` is built first, because it has the lowest confirmed price        |
| V5  | A project has a limit in seconds of generated video, and the default is 30                | One call costs real money. Seconds need no price table and are the same for each provider                           |
| V6  | The agent makes a still image first, and then makes the clip from that image              | A still costs little. The person sees and corrects the look before the costly step                                  |

## A video file in a scene

### Frame pictures

The renderer converts a video asset to JPEG pictures at the frame rate of the project:

```
ffmpeg -i <asset file> -vf fps=<framesPerSecond> -q:v 2 <cache folder>/%06d.jpg
```

- The cache folder is `<project>/.cache/video-frames/<contentHash>-<framesPerSecond>/`. The folder name replaces each character of the content hash outside `[a-z0-9-]` with `-`, so `sha256:abc` becomes `sha256-abc`. `openProject` ignores `.cache`. A person can delete it at any time.
- `createProject` writes `.cache/` to the `.gitignore` of the project.
- A file `complete.json` in the folder holds `{ "pictureCount": number }`. The renderer writes it last. A folder without it is not complete, and the renderer makes it again.
- FFmpeg writes to a temporary folder next to the cache folder. The renderer then renames it into place, so two renders never write the same folder.
- Picture `000001.jpg` is asset frame 0.
- The Vite server of the renderer serves a picture at `/asset-frames/<assetId>/<assetFrame>.jpg`. On the first request for an asset, it runs FFmpeg, and each request for that asset waits for it. A request for a frame at or past the last picture gets the last picture. A request for an asset that is not a video asset of the project gets status 404.
- If FFmpeg fails, the render returns the failure `video-frames-failed` with the asset id and the last line of the FFmpeg error output.

### Scene contract

`SceneAsset` gets one field for an asset of kind `video`:

```ts
type SceneAsset = {
  url: string;
  kind: "image" | "audio" | "video" | "font";
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
  words?: SceneWord[];
  framePictures?: { urlPrefix: string; count: number };
};
```

The picture of asset frame `n` is at `urlPrefix + n + ".jpg"`. `count` is equal to `durationFrames`.

`@yumekit/scene` gets one component:

```ts
function VideoFrame(props: {
  assetId: string;
  assetFrame: number;
  fit?: "cover" | "contain";
  focus?: { x: number; y: number };
}): ReactNode;
```

- `VideoFrame` draws one `<img>` that fills its parent. The adapter already waits until each image decodes, so `seek` stays exact.
- `assetFrame` below 0 shows frame 0. `assetFrame` at or past `count` shows the last frame. So a clip that is longer than its video holds the last picture. A non-integer `assetFrame` rounds down.
- `fit` is `cover` by default. `focus` is the point of the picture that stays visible when `cover` cuts it. Each value is from 0 to 1, and the default is the center.
- An asset id that does not exist, or that is not a video, makes the component throw. The render then returns `scene-error`, as for each scene error.

A scene must not use a `<video>` element. `checkSceneCode` returns `scene-compile-failed` for scene code that has one, with a message that names `VideoFrame`.

### Kit scene `video-clip`

| Name         | What it shows                                                                    | Props                                                |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `video-clip` | One video asset that fills the picture, with an optional caption line at the top | `assetId`, `fit`, `focus`, `startSeconds`, `caption` |

- At scene frame `f`, the scene shows asset frame `f + round(startSeconds * framesPerSecond)`.
- A wide clip in a tall output is cut with `cover` around `focus`. The agent sets `focus` to the subject.
- `caption` is at the top of the picture, in the same place and style as the caption of `image-pan`. So it does not cover the captions of `caption-words`.
- When the asset is missing or is not a video, the scene draws the placeholder color (rule 5 of document 08).
- The scene has no motion of its own. The clip is the motion.

## The sound of a clip

1. `probeMedia` returns `hasAudio` for a video file.
2. `Asset` gets `hasAudio?: boolean`. `import_asset` and `generate_asset` set it from `probeMedia`.
3. Rule 3 of document 03 becomes: an audio clip references an asset of kind `audio`, or an asset of kind `video` with `hasAudio`.
4. The audio mix of document 04 does not change. FFmpeg reads the audio stream of the video file in the same way as an audio file.

## Harness tools

`generate_asset` with the capability `video` already exists. This design adds one tool and one limit.

| Tool          | Input                                                                                        | What it does                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `place_video` | `output_id`, `asset_id`, `start_frame`, `duration_frames?`, `focus?`, `sound_gain_decibels?` | `putScene` for a `video-clip` scene, `addClip` on the first scene track that is not a caption track, and `addClip` for the sound, in one batch |

- The scene id is `video-` followed by the asset id. If the scene exists, the tool uses it and changes no props.
- `duration_frames` is the length of the asset by default.
- With no scene track other than a caption track, the scene clip goes on a new scene track `scenes` below the others.
- The sound clip goes on the audio track `video-sound`. The tool adds that track when the output does not have it. The sound clip is never longer than the video. `place_narration` does not use `video-sound`.
- `sound_gain_decibels` is -12 by default, so narration stays in front. The value `off` adds no sound clip. An asset without `hasAudio` gets no sound clip.
- If one edit of the batch is not valid, nothing changes, as for each batch.

The tool description of `generate_asset` says for the capability `video`: the call costs money for each second, the limit below applies, and the agent makes and checks a still image first.

The server instructions of document 05 get one step after step 5: "For a shot that code cannot draw, make a still image first. Check it with the person or with `preview_frame`. Then call `generate_asset` with the capability `video` and `first_frame_asset_id`, and add the clip with `place_video`."

### The limit

`media-tools.json` gets an optional field:

```json
{ "limits": { "generatedVideoSeconds": 30 } }
```

- The default is 30. The project file wins over the user file. The value 0 turns generated video off.
- Before a call with the capability `video`, the harness adds the length of each video asset with a source of kind `tool` to `duration_seconds` of the request. If the sum is larger than the limit, the harness makes no call and returns the failure `generated-video-limit-reached` with the seconds used, the seconds requested, and the limit.
- A repeated request that reuses a file does not count again.
- The message of the failure tells the agent to ask the person, and names the field that the person changes.
- The limit counts each generated video asset in the project, placed or not. Undo of the `generate_asset` call frees its seconds. The cost guard of milestone 4 replaces this limit with a spend record.
- `list_media_tools` returns `generated_video: { limit_seconds, used_seconds }`. `used_seconds` is counted in the same way as the limit check, so the agent sees the limit before it asks for a clip.

## The convention for `generate_video`

The row in document 06 becomes:

| Capability | Tool name        | Required input                                                | Optional input                                                                                                |
| ---------- | ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `video`    | `generate_video` | `prompt`, `duration_seconds`, `output_directory`, `file_stem` | `first_frame_path`, `last_frame_path`, `reference_image_paths`, `width_pixels`, `height_pixels`, `with_audio` |

Rules for a video server, in addition to the rules of document 06:

1. The server selects the nearest shape and size that the model supports. It reports the real size and the real length in the result.
2. The server rejects a `duration_seconds` that the model does not support, before any request. The message gives the supported range.
3. The server writes an MP4 file. If the model returns another container, the server does not convert it. It returns the file as it is, and `probeMedia` decides if yumekit can read it.
4. `with_audio` is true by default.
5. The server waits for the result. A video call can take minutes, so the server reports progress with MCP progress notifications when the client asks for them.

The default of `toolTimeoutSeconds` stays 600.

## `tools/gemini-media`

| Tool             | Default model           | Variable                     | Key              |
| ---------------- | ----------------------- | ---------------------------- | ---------------- |
| `generate_video` | `gemini-omni-1.2-flash` | `YUMEKIT_GEMINI_VIDEO_MODEL` | `GEMINI_API_KEY` |

- The server accepts a whole `duration_seconds` from 3 to 15.
- The server asks for 16:9 when the requested width is larger than the requested height, and for 9:16 in each other case. With no size, it asks for 16:9.
- The server asks for 720p by default. It asks for 1080p only when the optional input `resolution` is `1080p`. 720p costs about 0.07 US dollars for one second, and 1080p about 0.104. The model also offers `360p` and `4k`. The server does not offer them yet.
- `first_frame_path` becomes the image input. `reference_image_paths` accepts up to 6 images. The server rejects `last_frame_path` when `duration_seconds` is more than 10, because the model supports two frames only up to 10 seconds. It also rejects `last_frame_path` without `first_frame_path`.
- The server returns `cost_usd` when the response reports the video output tokens. The price for one million tokens is one constant (12 US dollars on 2026-11-21), and the variable `YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS` can replace it. The tool description says that the amount is an estimate.
- With no key, the tool returns a failure that names `GEMINI_API_KEY` and `passEnvironment`.
- The server checks the input before any request, so a call that cannot work costs nothing.
- The model always makes sound, and the API has no field that turns the sound off. So the server rejects `with_audio` set to false, with a message, and its catalog has no `with_audio` setting. To leave out the sound of a clip, the agent calls `place_video` with `sound_gain_decibels` set to `off`.
- The catalog gives `duration_seconds` the default 5.

### The Gemini API calls

The builder read these on 2026-11-21 in `aistudio.google.com/docs/omni`, `/docs/background-execution`, `/docs/api-errors`, `/api-reference/interactions-api/create-interaction`, and `/api-reference/models/get-model`.

| Step                | Request                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| Make the clip       | `POST https://generativelanguage.googleapis.com/v1beta/interactions`     |
| Wait for the result | `GET https://generativelanguage.googleapis.com/v1beta/interactions/{id}` |
| Download from a URI | `GET` of the `uri` of the video part                                     |
| `check_key`         | `GET https://generativelanguage.googleapis.com/v1beta/models/{model}`    |

- Each request sends the key in the header `x-goog-api-key`, never in the URL. It also sends `Api-Revision: 2026-05-20`, the revision of the `steps` schema.
- The body of the first request has `model`, `input`, `response_format`, and `background: true`. With no image, `input` is the prompt. With images, `input` is a list: one part `{ "type": "image", "data": <base64>, "mime_type": <type> }` for each image, then `{ "type": "text", "text": <prompt> }`. The order of the images is the first frame, the last frame, and then the reference images.
- `response_format` is `{ "type": "video", "aspect_ratio": "16:9" | "9:16", "resolution": "720p" | "1080p", "duration": "<n>s" }`.
- With a first frame and no reference images, the body also has `generation_config.video_config.task` set to `image_to_video`. The API defines that task as: the first image is the first frame, and the second image is the last frame. With reference images, the body has no task, as in the examples of the documents.
- While `status` is `in_progress`, the server waits 10 seconds and reads the interaction again. It stops after 55 reads (550 seconds), so it answers before `toolTimeoutSeconds`. It sends an MCP progress notification after each wait. Any other status than `in_progress` or `completed` is a failure that names the status.
- The video is the last part of type `video` in the steps of type `model_output`. The part has `data` (base64) or `uri`, and `mime_type`. The server sends the key to a `uri` only when its origin is `https://generativelanguage.googleapis.com`.
- The server reads the width, the height, and the length from the `moov` box of the MP4 file.
- `cost_usd` comes from `usage.output_tokens_by_modality`, the entry with `modality` set to `video`. The pricing page gives 5,792 tokens for one second at 720p and 8,688 at 1080p.
- A failure of the API is the status and `error.message` of the body.
- `check_key` reads the facts of the model. That request is free.

The bundled table of document 06 gets this server. `apps/cli/src/bundledServers.ts` resolves it by the name `gemini`.

## `tools/sample-media`

The sample server gets `generate_video`, so tests and dogfood cost nothing.

- It makes an MP4 with FFmpeg: a flat color from a hash of the prompt, a frame counter as large text, and a quiet tone as sound. With `with_audio` set to false, the file has no audio stream.
- It makes 1280 by 720 by default, and 720 by 1280 when the requested height is larger than the requested width. The frame rate is 24, so a 30 frame project proves the frame rate conversion.
- If FFmpeg is not installed, the tool returns a failure that says so.

## Work packages

Each work package is one pull request, as in document 07.

| Id   | Scope                                                                                                                                               | Needs      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| WP11 | Frame pictures in `@yumekit/render`, `framePictures` and `VideoFrame` in `@yumekit/scene`, `hasAudio` in `@yumekit/project`, kit scene `video-clip` |            |
| WP12 | The convention fields, `generate_video` in `tools/sample-media`, `place_video`, and the limit in `@yumekit/harness-mcp`                             | WP11       |
| WP13 | `tools/gemini-media`                                                                                                                                |            |
| WP14 | The acceptance content                                                                                                                              | WP12, WP13 |

WP11 and WP13 start together. Document 10 adds WP15 to WP17: keys and model descriptions, `tools/fal-media`, and `tools/local-video`.

### WP11 checks

1. A 24 frames per second test video in a 30 frames per second project gives a picture count equal to `durationFrames`, within one frame.
2. A test video encodes its frame number as the position of a marker. A scene with `VideoFrame` renders frame 0, frame 15, and the last frame. The marker in each PNG is at the position of the expected source frame.
3. Frames asked in the order 10, 3, 10 give the same picture for both calls of frame 10.
4. A second render does not run FFmpeg for frame pictures again. A cache folder without `complete.json` is made again.
5. A damaged video file gives `video-frames-failed` with the asset id.
6. `video-clip` holds the last picture when the clip is longer than the asset, and `startSeconds` moves the first picture.
7. `video-clip` with `cover` in a tall output keeps the `focus` point inside the picture.
8. An audio clip that references a video asset with sound is in the mix. `ffprobe` and a level measurement prove it. An audio clip that references a video asset without sound is rejected by the store.
9. Scene code with a `<video>` element is rejected by `checkSceneCode`.
10. The repeat check of document 04 passes for a timeline with a `video-clip` scene.

### WP12 checks

1. The sample `generate_video` gives a file of the requested length and shape, with and without sound. `ffprobe` proves each one.
2. `generate_asset` with the capability `video` and `first_frame_asset_id` passes the path of that asset as `first_frame_path`.
3. `place_video` gives one scene, one scene clip, and one sound clip in one revision. `undo` removes all three.
4. `place_video` with `sound_gain_decibels` set to `off`, and for an asset without sound, adds no sound clip.
5. The limit: a request inside the limit works, a request past it returns `generated-video-limit-reached` and starts no tool call, a reused request does not count again, and the value 0 rejects each request.
6. Dogfood: a headless agent with only the harness and the sample server builds a 10 second output with 2 generated clips and narration, and renders it.

### WP13 checks

1. Tests replace the network call at that outside boundary. They never spend money.
2. Tests cover text to video, a first frame, a rejected length, a rejected `last_frame_path`, a missing key, an API error, and a result that is not ready at the first poll.
3. A test proves the `cost_usd` value from a known token count, and that the variable replaces the price.
4. One manual check with a real key makes one 3 second clip at 720p. The pull request shows the `ffprobe` output and one frame.

### WP14 checks

1. An agent with only the harness builds a 20 to 30 second tall short with 3 generated clips, each one from a still image, with narration and captions.
2. `ffprobe` confirms the size, the frame rate, and the audio stream.
3. The paid video is 30 seconds or less in total.
4. The lead agent watches the file and lists each defect. A defect in yumekit becomes a fix or a follow-up in `README.md`.

## Not in this design

- Change of an existing clip: extension, edit by prompt, or a new sound.
- Speed change, reverse play, and a cut inside the frame pictures.
- Conversion of only the used part of a long video asset. Today the renderer converts the whole file at the first frame that shows it, inside the time limit of a scene.
- A spend record in dollars for each project (milestone 4).
- Preview of a clip with sound in the editor (milestone 2).
