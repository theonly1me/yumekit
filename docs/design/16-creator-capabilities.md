# 16. What a creator needs next

yumekit makes a video from one request, and document 15 lets the person open and change each step. This document adds the capabilities that a creator expects from a video studio in 2026: many models to pick from, camera moves, the same person and product in each shot, start formats, a plan before the work, a place for all files, and new kinds of media.

The list comes from a survey of the public pages of current AI video products on 2026-11-22. The survey gives names and counts that this document does not copy. Each work package checks the current documents of each service before it writes a model id or a setting.

## Decisions

| Id  | Decision                                                                                | Why                                                                                   |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| N1  | Each bundled server lists each current model of its service that fits a kind of yumekit | The person picks the model (document 15, S7). One model for a service is not a choice |
| N2  | A camera move is a named choice with a tested sentence for the prompt                   | A person knows "orbit" and "push in". A person does not know how to prompt for them   |
| N3  | The cast of a project holds people, places, and products, each with reference pictures  | The same face and the same product in each picture and each clip                      |
| N4  | A start format gives the AI a structure for the video                                   | "Product ad" and "Story" need different scenes, pace, and style                       |
| N5  | A person can ask for the plan first: the script and the pictures, then a stop           | A paid clip of a wrong plan is lost money                                             |
| N6  | The editor has one view with each file of the project                                   | The work belongs to the person: see it, save it, use it again                         |
| N7  | yumekit gets three kinds of media: sound effects, talking clips, and a sharper copy     | A video with a person who talks, and a clean export, are common needs                 |
| N8  | A video clip can take a last picture and a first picture                                | Two clips join without a jump                                                         |

## More models (N1)

- A catalog entry is data, as document 10 defines: the model id, its label, its kind, its settings, and its prices when the page of the service gives them. A server has one catalog file for each kind.
- `tools/fal-media` lists models for pictures, video clips, voice, music, and each new kind of this document. fal hosts models of many makers. The catalog holds the current model families for each kind, at least 6 for video and 6 for pictures, each read from its fal model page on the day of the build.
- `tools/gemini-media` lists the current picture, video, voice, and music models of the Gemini API. `tools/openai-media` lists the current picture, voice, and video models of the OpenAI API.
- A setting that many models share has one name in yumekit: `duration_seconds`, `resolution`, `aspect_ratio`, `with_audio`, `seed`. A catalog maps it to the name of the service.
- A model that takes a first picture, a last picture, or reference pictures says so in its entry: `accepts: ["first_frame", "last_frame", "reference_images"]`. The editor shows a control only when the picked model accepts it.
- A model with no tested call has `tested: false` in its entry. The editor shows "Not tested with yumekit yet" next to it. No test calls a paid service, so a real call needs a key of the owner. Each entry is checked against the documents of the service.

## Camera moves (N2)

- `@yumekit/project` has a catalog of camera moves, in a browser-safe entry as the platforms: `id`, `name`, one line for the person, and the sentence for the prompt.
- The first catalog: `static`, `push-in`, `pull-out`, `pan-left`, `pan-right`, `tilt-up`, `tilt-down`, `orbit`, `crane-up`, `drone-rise`, `tracking`, `handheld`, `crash-zoom`, `dolly-zoom`, `top-down`, `low-angle`.
- `generate_asset` with the capability `video` takes the optional `camera_move`. The harness adds the sentence of the move to the end of the prompt. An unknown id is the failure `camera-move-not-found` with the list of ids.
- "Make a real video clip" shows the moves as choices above the prompt, with "No camera move" first.
- The scene guide of the AI lists the ids with one line each.
- "Let the AI write it" in "Make a real video clip" is the fixed request "Make a real video clip for this scene. Write the prompt and pick the camera move yourself.", about that scene.

## The cast (N3)

- `cast` of `bible.json` (document 03) gets its form: `id`, `kind` (`person`, `place`, or `product`), `name`, `description`, and `referenceAssetIds` (0 to 4 picture assets).
- The tools `put_cast_member` and `remove_cast_member` change one entry, each as one undo step. `get_project` gives the cast.
- `generate_asset` takes the optional `cast_ids`. The harness adds the reference pictures of each entry to `reference_asset_ids`, and adds one sentence for each entry to the prompt: its name and its description. A model that does not accept reference pictures gets only the sentences.
- The editor has the view "Cast", from the top bar. A person adds an entry with a name, a description, and pictures: an upload (document 15), or "Make a picture of this" (a fixed request). A person removes an entry.
- The instructions of the AI get one rule: "Before the first picture, add each person, place, and product that shows in two or more scenes to the cast. Give the cast ids in each call that shows them."

## Start formats and the plan first (N4, N5)

- `@yumekit/project` has a catalog of start formats: `id`, `name`, one line for the person, and a paragraph of direction for the AI.
- The first catalog: `free` ("No format", the first pick), `explainer`, `product-ad`, `story`, `talking-head`, `list` ("5 tips"), `quote`, and `news`.
- The start screen shows the formats as a row of choices above the platforms. `POST /api/home/projects` takes `format_id` and `plan_first`. The home server adds the direction of the format to the first request, below the line of the platforms.
- "Show me the plan first" is a switch on the start screen. With it, the first request ends with the sentence "Stop after the script and the pictures of each scene, drawn by code. Make no voice, no music, and no paid clip yet. Ask me to continue."
- The Making screen then shows "Continue" next to "Open the editor" when the answer ends. "Continue" is the fixed request "The plan is good. Make the rest of the video."

## The Files view (N6)

- The editor has the view "Files", from the top bar. It lists each asset of the project in groups: pictures, video clips, voice, music, and sounds.
- Each row has a small picture or "Play", the name, the length or the size, how it was made (the service and the model, or "Your file"), and where the video uses it.
- Each row has "Download" and "Remove". "Remove" is off while a clip or a scene uses the file, and the row says where.
- "Add a file" uploads a file (document 15). A file that nothing uses yet has "Use in the video", a fixed request: "Use my file `<name>` in the video where it fits best."

## New kinds of media (N7, N8)

| Kind           | Tool of a server        | Input                                              | Result                      |
| -------------- | ----------------------- | -------------------------------------------------- | --------------------------- |
| `sound-effect` | `generate_sound_effect` | `prompt`, `duration_seconds?`                      | A sound file                |
| `talking-clip` | `generate_talking_clip` | A picture or a video of a person, and a voice file | A video clip with the voice |
| `sharper`      | `sharpen_media`         | A picture or a video clip, and `scale` (2 or 4)    | A larger copy of the file   |

- The three kinds join the list of capabilities of document 06, with the rules of document 10 for models, settings, and keys. `generate_asset` takes them as each other capability.
- A sound effect goes on a new audio track `sounds`. The Music view gets the group "Sounds" with the sounds of the video, and "Add a sound" (a fixed request with the words of the person).
- The scene panel of a scene with a person of the cast has "Make this person talk". It opens "Make a real video clip" with the talking models, the picture of the scene as the person, and the voice clip of the scene as the voice.
- Export gets the choice "Sharper" for each platform when a `sharper` model for video is ready. It is off at the start. The price shows before the export.
- For a video model that accepts it, `generate_asset` takes `last_frame_asset_id`, as it takes `first_frame_asset_id` (document 09). "Make a real video clip" shows "End on this picture" next to "Start on this picture".

## Work packages

| Id   | Scope                                                                                       | Needs      |
| ---- | ------------------------------------------------------------------------------------------- | ---------- |
| WP41 | Camera moves, "Let the AI write it", and the last picture of a clip                         | WP32       |
| WP42 | The cast: the format, the two tools, `cast_ids`, the view, and the rule of the AI           |            |
| WP43 | Start formats and the plan first                                                            | WP37, WP39 |
| WP44 | The Files view                                                                              | WP40       |
| WP45 | The catalogs of `tools/fal-media` for pictures and video clips, with `accepts` and `tested` |            |
| WP46 | The catalogs of `tools/gemini-media` and `tools/openai-media`                               |            |
| WP47 | The three new kinds, with fal models, and their places in the editor                        | WP44, WP45 |

### Checks

1. WP41: a call with `camera_move` sends the sentence of the move to the media server. An unknown id fails with the list.
2. WP42: a picture call with `cast_ids` sends the reference pictures of the entry. Each tool is one undo step. A project with the old empty cast loads.
3. WP43: each format reaches the first request. With the plan first, the fake agent stops after the pictures, and "Continue" sends the fixed request.
4. WP44: the view lists each asset with its use. "Remove" is off for a file in use.
5. WP45 and WP46: for each model, a test sends the default value of each setting to a stub of the service and gets a request body that matches the documents of the service. A test fails when a catalog entry has no source page in its record.
6. WP47: each kind makes a file with the sample server, which gets a free version of each tool.
7. Each work package of the editor shows screenshots in dark and in light, at 1440 pixels and at the width of a phone.

## Not in this version

- A change of an existing clip by a video model (another person, another place, another camera).
- A copy of the motion of one video onto a person of the cast.
- A voice that copies the voice of the person.
- A board of connected steps.
- Shared projects.

## Details of WP46

The builder read each fact below on 2026-11-22, in `aistudio.google.com/docs` (where `ai.google.dev/gemini-api/docs` now redirects) and in `developers.openai.com/api/docs` (where `platform.openai.com/docs` now redirects). Each catalog entry keeps the URL of its page as `sourceUrl`, next to the model. The description of a server does not send it.

1. `tools/gemini-media` lists these models. Each one has `tested: false`, `gemini-omni-1.2-flash` included, because no real call ran.

   | Kind    | Model id                      | Price in the catalog                                     |
   | ------- | ----------------------------- | -------------------------------------------------------- |
   | Picture | `gemini-nano-banana-2.1`      | 0.0336 (1K), 0.0504 (2K), 0.113 (4K) US dollars an image |
   | Picture | `gemini-3.1-flash-image`      | 0.067 (1K), 0.101 (2K), 0.151 (4K)                       |
   | Picture | `gemini-3-pro-image`          | 0.134 (1K and 2K), 0.24 (4K)                             |
   | Picture | `gemini-3.1-flash-lite-image` | 0.0336, one size (1K)                                    |
   | Voice   | `gemini-3.8-flash-tts`        | 0.000225 US dollars a second                             |
   | Voice   | `gemini-3.8-flash-lite-tts`   | 0.00015 a second                                         |
   | Music   | `lyria-3.5`                   | None. The page gives 0.08 for each song                  |
   | Music   | `lyria-3-clip-preview`        | None. The page gives 0.04 for each 30 second clip        |
   | Video   | `gemini-omni-1.2-flash`       | As in document 09                                        |

2. The defaults are `gemini-nano-banana-2.1` (stable, and the lowest price for each picture), `gemini-3.8-flash-tts`, `lyria-3.5` (stable, with a free length), and `gemini-omni-1.2-flash`.
3. Each new tool uses `POST /v1beta/interactions` with no `background`, and reads the last part of its type in the `model_output` steps, as the video tool does. If the answer is `in_progress`, the tool waits in the same way as the video tool.
4. `generate_image` sends `input` as the text part and then one image part for each reference picture. `response_format` is `{ "type": "image", "aspect_ratio", "image_size" }`. The server picks the nearest shape of the model from `width_pixels` and `height_pixels`, and sends no shape with no size, so the model makes a square. `resolution` is `1K`, `2K`, or `4K`, and `1K` by default. `gemini-3.1-flash-lite-image` has one size, so it gets no `image_size` and takes no `resolution`. The page gives no limit of reference pictures for it, so it takes none. The 512 pixel size of `gemini-3.1-flash-image` is left out, because the page does not show its exact value. `transparent_background` set to true is rejected, because no page offers it.
5. `generate_speech` sends `input: [{ "type": "user_input", "content": [{ "type": "text", "text" }] }]`, `response_format: { "type": "audio" }`, and `generation_config.speech_config: [{ "voice" }]`, as the speech guide shows. The API reference names the field `structured_speech_config`. The builder follows the guide, because each of its examples uses `speech_config`. A first real call must confirm it. `instructions` becomes the annotation `{ "type": "speech_metadata", "style" }` of the text. `speed` is rejected, because the model has no such field. The voice is one of the 30 prebuilt voices, and `Kore` by default. The answer is a WAV file, and the server reads its length and returns `cost_usd` as an estimate from the price for each second.
6. The speech prices are the prices until 2026-12-31. The pricing page doubles the price of `gemini-3.8-flash-tts` from 2027-01-01.
7. `generate_music` sends `{ model, input }`: the prompt as text, or the text part and up to 10 image parts. The music guide has no field for the length or for singing. So the server adds "Make it N seconds long." for `lyria-3.5`, and "Instrumental only, no vocals." (the words of the guide) when `instrumental` is true, the default. `lyria-3.5` takes 10 to 180 seconds. The guide says "a couple of minutes", so the range is a choice of the builder. `lyria-3-clip-preview` always makes 30 seconds, so it takes only 30. The server reads the length of the MP3 file from its frames.
8. A price for each song does not fit `MediaModelPrice`, so the music models have an empty `prices` list.
9. Left out of the Gemini catalog: `gemini-2.5-flash-image` (the image guide calls it legacy), `gemini-3.1-flash-tts-preview` (the models page calls it legacy), `gemini-2.5-flash-preview-tts` and `gemini-2.5-pro-preview-tts` (the speech guide does not say that they take the request above), `lyria-3-pro-preview` (its page names `lyria-3-clip-preview` as its model code, and the music guide does not show it), `lyria-realtime-exp`, `genie-4`, and the Live models (they stream, which the convention does not cover), and `gemini-omni-1.1-flash` (it routes to `gemini-omni-1.2-flash` on 2026-12-03).
10. `tools/openai-media` lists these models. The models of before keep their state, so they have no `tested`. Each new model has `tested: false`.

    | Kind    | Model id                 | New | Note                                                            |
    | ------- | ------------------------ | --- | --------------------------------------------------------------- |
    | Picture | `gpt-image-2.5-flare`    | No  | The default                                                     |
    | Picture | `gpt-image-2.5-sunburst` | Yes | Same settings. Token prices only                                |
    | Picture | `gpt-image-2.6-flare`    | Yes | Same settings. Token prices only                                |
    | Picture | `gpt-image-2.6-sunburst` | Yes | Same settings. Token prices only                                |
    | Voice   | `gpt-4o-mini-tts`        | No  | The default. Shuts down on 2027-01-06                           |
    | Voice   | `tts-1`                  | Yes | 0.015 US dollars for 1,000 characters. Shuts down on 2027-01-06 |
    | Voice   | `tts-1-hd`               | Yes | 0.03 for 1,000 characters. Shuts down on 2027-01-06             |
    | Align   | `whisper-1`              | No  | The only model with word timestamps. Shuts down on 2027-02-26   |

11. `tts-1` and `tts-1-hd` take 9 voices, `alloy` by default, and no `instructions`, as the API reference says. The server rejects another voice and `instructions` before any request. It returns `cost_usd` as an estimate from the number of characters.
12. OpenAI has no video model in the public API. The video generation guide says that the Sora 2 models and the Videos API shut down on 2026-09-24, with no replacement. So `tools/openai-media` gets no `generate_video`. The OpenAI API has no music model.
13. `accepts` lists `reference_images` for each picture model that takes reference pictures and for the music models, and `first_frame`, `last_frame`, and `reference_images` for `gemini-omni-1.2-flash`. A voice model has no `accepts`.

## Details of WP45

The builder read each fal model page, its `llms.txt` page, and its schema at `fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>` on 2026-11-22. The list of current models came from `api.fal.ai/v1/models`.

1. `tools/fal-media` uses the optional fields `accepts` and `tested` of `@yumekit/tools` (WP46 added them). A description without them stays valid. `list_media_tools` passes them on, and its description tells the AI what they mean. `accepts` takes the three values of N1. An audio input of a model (for example `target_audio_url` of MiniMax H3) is not in the convention, so `accepts` does not name it and the server does not send it.
2. Each model of `tools/fal-media` has `tested: false`, Seedance 2.5 included, because no call with a real key ran yet (the README follow-up). Each model of the sample server has `tested: true`, because the tests call it.
3. The sample video model accepts each of the three inputs, and the sample picture model accepts reference pictures. The sample server ignores them, so the editor can show each control with the free server.
4. A model record names its fal model pages in `sources`. The test of check 5 compares each request body with a recorded copy of the schema of its endpoint in `tools/fal-media/src/testing/recordedSchemas`.

Video models (`generate_video`):

| Model                  | Id                              | First, last, reference      | Sound                  | Price for one second                                  |
| ---------------------- | ------------------------------- | --------------------------- | ---------------------- | ----------------------------------------------------- |
| Seedance 2.5           | `bytedance/seedance-2.5/us`     | Yes, yes, no                | Switch                 | 0.2205 (480p) to 1.840 (4k)                           |
| Kling 4                | `kling/v4`                      | Yes, yes, no                | No setting on the page | 0.157 (720p), 0.235 (1080p), 0.549 (4k)               |
| Gemini Omni Flash 1.2  | `google/gemini-omni-flash/v1.2` | Yes, yes (up to 10 s), 10   | Always                 | 0.0273 (360p) to 0.2457 (4k), and input tokens        |
| MiniMax H3             | `minimax/h3`                    | Yes, yes, 9                 | Always                 | 0.05 (480P), 0.06 (768P), 0.13 (2K), 0.16 (4K)        |
| Wan 3.0                | `alibaba/wan-3.0`               | Yes, yes, no                | Switch (`audio`)       | 0.05 (480p), 0.10 (720p), 0.20 (1080p)                |
| LTX 2.5 Pro            | `lightricks/ltx-2.5/pro`        | Yes, yes, no                | Switch                 | 0.12 (720p), 0.17 (1080p). Length 6, 8, or 10         |
| PixVerse 6             | `fal-ai/pixverse/v6`            | Yes, no, no                 | Switch, off on fal     | 0.025 to 0.115, by resolution and sound               |
| FLUX 3 Video           | `blackforestlabs/flux-3/video`  | Yes, yes (own endpoint), no | Switch                 | 0.17 (720p), 0.29 (1080p), 0.32 (1440p), 0.47 (2160p) |
| Grok Imagine Video 1.5 | `xai/grok-imagine-video/v1.5`   | Yes, yes, no                | Switch                 | 0.08 (480p), 0.14 (720p), 0.25 (1080p)                |

5. A model with "Always" rejects `with_audio: false`. Kling 4 has no sound field on its page, so it rejects each `with_audio`. A model with a switch sends `with_audio`, true by default, also for PixVerse 6, which is off by default on fal.
6. A request with reference pictures goes to the reference endpoint. The server rejects reference pictures together with a first frame, because no endpoint takes both.
7. The reference endpoints of Seedance 2.5 and Grok Imagine Video 1.5 are a follow-up. The extra fees for reference pictures and input tokens are not in the estimate.
8. `check_key` still asks for the price of the Seedance text endpoint only.

Picture models (`generate_image`):

| Model               | Id                             | Reference pictures | Settings               | Price for one picture                     |
| ------------------- | ------------------------------ | ------------------ | ---------------------- | ----------------------------------------- |
| Seedream 5.5        | `bytedance/seedream/v5.5`      | Up to 10           | Transparent background | 0.03, and 0.012 for each reference        |
| Nano Banana 2.1     | `google/nano-banana-2.1`       | Up to 10           | `resolution` 1K to 4K  | None. The page gives token prices only    |
| FLUX 3              | `blackforestlabs/flux-3/image` | Up to 10           | `resolution` 1k to 4k  | 0.048 at 1k. Other sizes not given        |
| GPT Image 2.6 Flare | `openai/gpt-image-2.6/flare`   | Up to 16           | `quality`, transparent | None. The page gives token prices only    |
| Ideogram 4.6        | `ideogram/v4.6`                | No                 | `quality`, transparent | 0.008, 0.03, 0.06, or 0.10 by quality     |
| Qwen Image 3        | `alibaba/qwen-image-3`         | Up to 3            | None                   | 0.04                                      |
| MiniMax H3 Image    | `minimax/h3-image`             | Up to 16           | None                   | None. The page gives token prices only    |
| Krea 3              | `krea/v3`                      | Up to 8            | None                   | 0.025, and up to 0.025 for each reference |

9. Seedream 5.5 is the default picture model: it has a known price, reference pictures, and a transparent background.
10. With reference pictures, the server uses the edit endpoint of the model and sends the uploaded files as `image_urls`. The edit endpoint of Ideogram 4.6 changes one picture with a mask, so Ideogram takes no reference pictures here.
11. The Nano Banana 2.1 page gives no maximum for `image_urls`. yumekit sends at most 10.
12. A model with `image_size` gets an exact size with the shape of the request: a fixed number of pixels for each model, a ratio from 2:5 to 5:2, and sides in multiples of 32. Seedream 5.5 gets about 2.56 million pixels, so the 0.03 price applies. Ideogram 4.6 and MiniMax H3 Image get about 2048 by 2048, GPT Image 2.6 Flare about 1.57 million, and Qwen Image 3 and Krea 3 about 1024 by 1024. A model with `aspect_ratio` gets the nearest ratio of its list. With no size, the picture is square.
13. The server asks for PNG where the model has `output_format`, and names the file by its real type: `.png`, `.jpg`, or `.webp`.
14. `cost_usd` is an estimate from the catalog, with the reference fees. A model with no price gives no `cost_usd`.

The editor (WP32 and WP38) shows "Not tested with yumekit yet" next to a model with `tested: false`, and shows the controls for the first picture, the last picture, and reference pictures only for the values in `accepts`.

## Details of WP44

These rules came from the build of WP44.

1. No harness tool removed an asset. The new tool `remove_asset` (document 05) removes the record with the edit `removeAsset`, as one undo step. It fails with `asset-in-use` and names each use. The media file stays in `assets/files/`, because undo restores no media file. The removal of files that no record references stays a follow-up of the README.
2. The store checks the clips and the cast before `removeAsset`, but not the props of a scene. So the uses have one rule, `assetUsesOf` in the new browser entry `@yumekit/project/asset-uses`: a scene whose props hold the asset id under a key with the word "asset" (at any depth, also in a list), an audio clip, and a cast member. The harness and the editor both use it. Document 01 permits the entry for the editor.
3. The groups: a picture is in Pictures, a video in Video clips, and a font in Fonts (a sixth group, shown only when a font exists). A sound is in Voice when it is on the voice track, or has word timings, or came from a speech tool. It is in Music when it is on a music track or came from a music tool. Each other sound is in Sounds, also a track with the id `sounds`.
4. The name of a row is `originalName` for a file of the person, and the prompt or the text of the call for a made file, or else the asset id. The size is the length for a sound and a video, and the width and the height in pixels for a picture.
5. "How it was made" is "Your file" for a file of the person, and "Made with `<service>`, `<model>`" from the labels of the media servers for a made file.
6. The places: "Scene N" on the scenes row of the first output that shows the scene, "Captions" for a caption scene, "Voice", "Music", "Sounds", and "The cast". The sound of a video clip on the track `video-sound` counts under the scene of the clip. A scene that is on no row is "The scene `<title>`, not in the video". It still keeps the file, because it can come back.
7. "Use in the video" shows on each row that nothing uses. For a made file, the request names the asset id in place of the file name, because the AI finds a file by its id.
8. A video row loads the file only after "Play", because a video file can be large. A picture row shows the picture, and a sound row has "Play".
9. The upload keeps the original name of the file. The engine passes the last part of the name, without control characters, as the new input `original_name` of `import_asset`. The temporary file and the asset id still come from the safe name of item 1 of "Details of WP40". So "Morning guitar.wav" shows as "Morning guitar.wav" in each view, and the download keeps that name.
10. The Voice and Music views show "Your file." in place of the line `MadeWith` under "What the voice says" and "In your video now" when the voice or the music is a file of the person. A sound row shows the original name of a file of the person.
11. A fixed request ends each sentence with a period, also after the words of the person. A question mark or an exclamation mark that the person typed stays.
12. The Script view loads only when a person opens it, with the line "Loading the script." React has its own file in the build. So the editor build has no file larger than 500 kB, and the main file is about a third of its old size.
13. Below 640 pixels, the buttons of the views in the top bar ("Script", "Pictures", "Files") are in one menu "Open". The bar then fits at the width of a phone. Each new view of the bar goes into the same list.

## Details of WP43

WP43 made these choices where this document gives no rule.

1. The catalog is the entry `@yumekit/project/start-formats`, with no Node code, as `@yumekit/project/platforms`. Document 01 and `scripts/importRules` permit it for the editor. The main entry of `@yumekit/project` exports the same names.
2. A format has `id`, `name`, `line`, and `direction`. `free` has an empty direction, so the first request gets no format line. Each other direction starts with "Structure, in this order:", gives each beat a share of the length in percent (the shares add up to 100), and then gives the pace, the scenes that fit, and what to avoid. A test checks these parts and a limit of 120 words.
3. The directions follow the common practice of short platform video: a hook in the first 2 seconds, one idea in each scene, and a last scene with one action. The builder wrote them from that practice, not from one source.
4. The format line is `Format: <name>. <direction>`, directly below the line of the platforms. The plan sentence is the last line of the first request, after the line of the transitions. `planFirstSentence` is in the catalog entry, so the home server and the editor share one copy.
5. `format_id` is optional, with `free` as the default. `plan_first` is optional, with `false` as the default. A format that is not in the catalog gives `body-not-valid` (400) and makes no project. The project does not keep the format, because the AI reads it once, in the first request.
6. The order of the start screen: the prompt, "What kind of video?", "Where will it go?", "How the video is made", "How long?", "Look", then "Make the video" with the switch. The format row comes first after the prompt because it changes the meaning of the request, as the design says ("above the platforms"). Each row has a first value, so "Make the video" needs only the prompt.
7. The format row uses the pill group of "How long?" with the names only. One line under the row describes the picked format. At the width of a phone, the row stays one line and scrolls to the side.
8. The screen was long after the new row: the button was below the fold at 1440 by 900. So "Make the video" and "Show me the plan first" sit in one bar that sticks to the bottom of the window while the person scrolls, and rests at the end of the form. The gap between the groups went from 44 to 34 pixels. At the width of a phone, the bar is one line and hides the line under the switch.
9. The editor knows a plan-first project from the first request: its text ends with `planFirstSentence`. The answer to the second request belongs to the Making screen only when the second request is the text of "Continue". Its steps follow the steps of the first answer.
10. While the plan waits (the first answer ended as `done`, and no second request exists), the title is "The plan is ready", with one line that says what to do. Voice, Music, and "Put it together" show as waiting with "Waits for Continue". "Put it together" is not done when the plan ends, also after `set_timeline`, because the video has no voice and no music yet. The views are open for a change, because no request runs.
11. "Continue" is the main button, and "Open the editor" is next to it. "Continue" sends the fixed request `continue-after-the-plan` and keeps the Making screen. The title goes back to "Making your video", and the views lock. In the answer to "Continue", "Put it together" is done only when that answer ends as `done`, so a `set_timeline` of the plan cannot mark it early.
12. The Making screen also shows at the first load when the plan waits, or when the answer to "Continue" runs. So a reload does not lose "Continue".
13. Another fixed request from a view of the plan (for example "Change the picture") opens the editor, as item 4 of "Details of WP37" says. The person then asks for the rest in the chat.
14. The real check ran Claude Code with `ANTHROPIC_MODEL=haiku` and no media key: a 15 second `product-ad` for TikTok with the plan first. The AI made 7 scenes in the order of the format: hook, problem, product, three proofs, and the call to action last. It called no voice and no music tool, stopped, and asked "Shall I continue with the voice and the music?". It drew a placeholder for the number and the customer quote, because the person gave none. So the direction of `product-ad` now says to use a number or a quote only from the person, and never a placeholder. After "Continue", the AI said in plain words which key the voice and the music need.

## Details of WP42

1. An entry of the old form has no `kind`. The store reads it as `person`, because the old cast held "the recurring characters". The format version stays 1. The next write of `bible.json` adds the field.
2. The file format sets no limit on `referenceAssetIds`, so an old project with more pictures still loads. `put_cast_member` and `set_bible` take 4 pictures or fewer. Each picture is an image asset, or the call fails with `asset-not-found`.
3. `put_cast_member` takes `cast_id`, `kind`, `name`, `description`, and `reference_asset_ids?`. It adds the entry at the end of the cast, or replaces the entry with that id in place. Without `reference_asset_ids`, an entry that exists keeps its pictures, and a new entry has none.
4. `remove_cast_member` takes `cast_id`. Each cast tool sends one `setBible` edit, so each call is one undo step. The pictures of a removed entry stay in the project.
5. An unknown id in `cast_ids`, `put_cast_member`, or `remove_cast_member` is the failure `cast-member-not-found`, with the ids of the cast in the hint. `cast_ids` with `speech` or `music` is the failure `invalid-value`.
6. The sentence of an entry is `<name>: <description>.`, or `<name>.` with no description. The sentences go after an empty line at the end of the prompt, in the order of `cast_ids`.
7. A model accepts reference pictures when its description has the setting `reference_image_paths` of the kind `image-files`. The servers that list `reference_images` in `accepts` also have that setting. Its `maximum` limits the list. The pictures of `reference_asset_ids` come first, then the pictures of each entry in the order of `cast_ids`, with no repeats.
8. `MediaTools` gets `chosenModel({ capability, server?, model? })`. It gives the described model that a call with the same choice uses, with the same rules as `run`. A server with no description gives no model, so the call gets only the sentences.
9. The source record of the asset holds the prompt with the sentences and the merged `reference_asset_ids`. So a change of an entry makes a new file, and the same entry reuses the earlier file.
10. The editor makes the id of a new entry from its name, for example `blue-mug`, with a number after it when the id is in use.
11. "Make a picture of this" is the fixed request `make-a-cast-picture` of the editor: `Make a picture of "<name>" from the cast. It looks like this: <description>. Add the picture to the pictures of that cast entry.` The view closes, and the chat shows the request. The row has it while the entry has fewer than 4 pictures.
12. "Add a picture" uploads the file with `POST /api/uploads?name=<file name>` of document 15, then the person saves the entry. A file that is not a picture shows "This file is not a picture." and the entry does not get it.
13. "Cast" is in the list of views of the top bar, after "Pictures". So below 640 pixels it is in the menu "Open" too. At that width the bar does not cut off the menu, so each item of the menu can take a click.
