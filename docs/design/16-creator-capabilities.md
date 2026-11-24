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
- The Making screen then shows "Continue" next to "Open the editor" when the answer ends. "Continue" is the fixed request "The plan is good. Make the rest of the video." (Since WP57 of document 18: "The plan is good. Use the script and the scenes as they are now, and make the rest of the video.")

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

## Details of WP47

The builder read the list of fal models at `api.fal.ai/v1/models` on 2026-11-23, then each model page, its `llms.txt` page, and its schema at `fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>`. This part builds sound effects and the sharper copy. The talking clip follows in its own change.

1. The capabilities are `sound-effect` with the tool `generate_sound_effect`, and `sharper` with the tool `sharpen_media`. Both are in the list of capabilities of `@yumekit/tools`, in `defaults` of `media-tools.json`, and in the picker of Settings, with the rows "Sounds" and "Sharper copy".
2. `generate_sound_effect` takes `prompt` and the optional `duration_seconds`. It returns one audio file. A server can leave out `duration_seconds` of the file. `generate_asset` then reads the length with `probeMedia`, as it does for a video.
3. `sharpen_media` takes `media_path` (a PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video) and `scale`, 2 or 4. It returns one file of the same kind, with its size.
4. A sharper model names what it takes in `accepts`: `image_input` for pictures, `video_input` for video. These are two new values of `accepts` (document 10). The talking clip uses them too.
5. With no `model`, a sharper server uses its default model when that model takes the kind of the file. Otherwise it uses the first model of its catalog that takes it. A model for the other kind is a failure that names the kind, before any request.
6. `generate_asset` with `sharper` needs `media_asset_id`, an image or video asset. The harness gives the tool its file as `media_path`, and the source record keeps `media_asset_id`. A missing or wrong id is `asset-not-found` with the ids of the pictures and video clips. `media_asset_id` with another capability is `invalid-value`.
7. The new tool `place_sound` puts an audio asset on the track `sounds` of an output at `start_frame`, at -6 decibels unless `gain_decibels` says otherwise. When a sound already plays there at the same time, the clip goes on `sounds-2`, then `sounds-3`. A new track goes below the other tracks. The clip stops at the end of the last scene, so a sound never makes the video longer. A start at or after that end is the failure `start-after-the-end`. It is one undo step.
8. `place_narration` never uses a `sounds` track, also when it is the first audio track.
9. The renderer and the preview of the editor mix each audio track that is on, so a `sounds` track plays in both with no change. A test renders a sound at 1.5 seconds and reads the volume before and after it.
10. The Music view has the group "Sounds" between "Try another" and "Use my own music". It lists each sound of the video once, also when two outputs have it at the same frame, in the order of time: "Play", the prompt or the file name, the place ("At 0:01, in scene 2"), and "Remove". "Remove" calls `remove_clip` for the clip in each output, so it is one undo step for each output. With no sound, the group says what a sound is.
11. "Add a sound" is the fixed request `add-a-sound`: "Add this sound to the video where it fits: `<words>`." The line `MadeWith` in one-time mode under it adds the model sentence of document 15.
12. Each `sounds` track has the sound row "Sounds" ("Sounds 2" for the next one), with the count of its sounds and "Open", which opens the Music view. A `sounds` track is not a music row. The lead line of Export names the sounds.
13. The new tool `make_sharper_copy` takes `output_id`, `platform_ids?` (each platform of the output by default), `scale?` (2 by default), `server?`, and `model?`. It needs the file of `render_video`, or it fails with `render-not-found`. It calls the `sharper` capability once for the output, writes `renders/<name>-sharper.mp4` next to the first chosen file, and links or copies it for each other chosen platform. The normal file stays. An unknown platform is `platform-not-found` with the platforms of the output.
14. Export shows the switch "Sharper" under each chosen row when the sharper pick of Settings is ready and its model has `video_input` in `accepts`. The switch is off at the start. Next to it: "2 times wider and taller.", the price for the length of the row from the price for each second of the model ("Free", "About $0.70", or "Price not known"), and the model, or a line that the free test service makes a plain larger copy.
15. After the export of an output, the editor calls `make_sharper_copy` once for the rows of that output with the switch on, with scale 2. The row then has "Show the sharper file" next to "Show the file". A failure keeps the normal file and says so under the row.
16. The sample server gets `sample-sound-effect` (a WAV file with a short tone at 880 hertz, 1 second unless `duration_seconds` says otherwise, up to 30) and `sample-sharper` (a real larger copy with FFmpeg, a PNG for a picture and an MP4 with its sound for a video). Both have `tested: true`. `sample-sharper` accepts `image_input` and `video_input`.

Sound effect models of `tools/fal-media` (`generate_sound_effect`):

| Model                      | Id                                              | Length in seconds | Price in the catalog               |
| -------------------------- | ----------------------------------------------- | ----------------- | ---------------------------------- |
| ElevenLabs Sound Effects 3 | `elevenlabs/sound-effects/v3`                   | 1 to 30           | 0.002 US dollars a second          |
| Mirelo SFX 2.0             | `mirelo-ai/sfx2.0/text-to-audio`                | 1 to 600          | 0.015 a second                     |
| Sonilo 1.1 Sound Effects   | `sonilo/v1.1/text-to-sound-effects`             | 1 to 180          | 0.0018 a second                    |
| Stable Audio 3 Small SFX   | `fal-ai/stable-audio-3/small/sfx/text-to-audio` | 1 to 120          | None. The page gives 0.0206 a file |

17. ElevenLabs Sound Effects 3 is the default: it has the lowest price for each second of a model that picks a length from the prompt. With no `duration_seconds`, it gets no length and picks one. Each other model gets 5 seconds, because their defaults (30 and 8 seconds) are long for one sound.
18. Each model asks for MP3. Mirelo SFX 2.0 gets `num_samples: 1`, because fal bills each sample and the default is 2. The Mirelo page gives 0.010 a second until 2026-12-13 and 0.015 after it. The catalog has 0.015.
19. `cost_usd` is the price for each second times `duration_seconds`. A call with no length gives no `cost_usd`.

Sharper models of `tools/fal-media` (`sharpen_media`):

| Model                                 | Id                                 | Takes    | Scale field                   | Price in the catalog |
| ------------------------------------- | ---------------------------------- | -------- | ----------------------------- | -------------------- |
| Bria Increase Resolution for video    | `bria/video/increase-resolution`   | Video    | `desired_increase` "2" or "4" | 0.14 a second        |
| Topaz Precision for video             | `topaz/upscale/video/precision`    | Video    | `upscale_factor` 1 to 4       | None                 |
| SeedVR2 for video                     | `fal-ai/seedvr/upscale/video`      | Video    | `upscale_factor` 1 to 10      | None                 |
| FlashVSR+ for video                   | `openimaginglab/flashvsr-plus`     | Video    | `upscale_factor` 1 to 4       | None                 |
| Crystal Upscaler for video            | `clarityai/crystal-video-upscaler` | Video    | `scale_factor`                | None                 |
| Bria Increase Resolution for pictures | `bria/increase-resolution`         | Pictures | `desired_increase` 2 or 4     | 0.04 a picture       |
| Topaz Precision for pictures          | `topaz/upscale/image/precision`    | Pictures | `upscale_factor` 1 to 4       | None                 |
| SeedVR2 for pictures                  | `fal-ai/seedvr/upscale/image`      | Pictures | `upscale_factor` 1 to 10      | None                 |
| Crystal Upscaler for pictures         | `clarityai/crystal-upscaler`       | Pictures | `scale_factor`                | None                 |

20. Bria Increase Resolution for video is the default: it takes exactly 2 or 4, keeps the sound, and has one price for each second. The server asks it for `mp4_h264`, because its default is WebM. Topaz gets `H264_output: true`, and SeedVR2 and FlashVSR+ get `X264 (.mp4)`. Each picture model asks for PNG where it can.
21. Topaz prices by the started 24 megapixels of a picture and by the output resolution of a video. SeedVR2, FlashVSR+, and Crystal price by megapixel. These do not fit `MediaModelPrice`, so the models have an empty `prices` list and give no `cost_usd`. For Bria, `cost_usd` is 0.04 for a picture, and 0.14 times the length of the video.
22. The server uploads a picture of at most 30 MB, the image limit of fal. The pages give no size limit for a video upload, so the server sets none. Bria takes a video under 30 seconds, and FLUX Video Upscale under 20.
23. Left out: ElevenLabs Sound Effects V2 (fal retires it on 2027-02-01), the older Cassette sound effects, FLUX Video Upscale (its factor is 1.5 to 3, so it takes no 4), LTX 2.5 Upscale and Gemini Omni Flash 1.2 Upscale (they take a target resolution, not a scale), and the creative upscalers (Bria creative, Recraft, Topaz creative and generative), because they change the content of the picture.
24. Each fal model has `tested: false`. The test of check 5 of document 16 sends the default of each setting of each model to a stub of fal and compares the body with the recorded schema in `tools/fal-media/src/testing/recordedSchemas`.

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

## Details of WP41

The builder read the camera guides below on 2026-11-23.

- Google Veo, the video prompt guide of Vertex AI: `docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide`. It names "Static shot", "Dolly (in/out)", "Pan (left/right)", "Tilt (up/down)", "Arc shot", "Crane shot", "Aerial shot or drone shot", "Handheld", "Bird's-eye view or top-down shot", and "Low-angle shot". It asks for positive words, not "no" or "don't".
- Kling, the camera control guide: `kling.ai/blog/kling-ai-camera-control-video-guide`, and the Kling 4 guide of fal: `fal.ai/learn/devs/kling-4-prompting-guide`. It names "Push in", "Pull back", "Pan left", "Tilt up", "Orbit slowly", and "Static camera", asks for "one main camera action" in a shot, and a speed such as "slow, stable".
- Seedance 2.0, the guide of fal: `fal.ai/learn/tools/seedance-2-0-prompting-guide`. It names "push-in", "dolly", "pan", "tilt", "crane", "locked-off", "arcs around", "tracks alongside", "handheld", and "aerial", and puts the camera words after the subject and the action.
- Runway, the camera prompt guide: `runway.com/resources/ai-camera-prompts`. It names each move of the catalog except the dolly zoom, asks for a speed with each move, and warns that stacked moves turn into drift.

1. Each sentence of the catalog names one move, its speed, and what stays in frame, with the words that these guides share. Each sentence has fewer than 25 words and uses no negative word. No guide names the dolly zoom, so its sentence ("dollies in slowly while zooming out") is a choice of the builder, and a model can follow it less well.
2. The catalog is the browser entry `@yumekit/project/camera-moves`: `cameraMoveCatalog`, `cameraMoveIds`, `findCameraMove`, and `isCameraMoveId`. Each move has `id`, `name`, `line` (for the person), and `sentence` (for the model). Document 01 permits the entry for the editor. The names for the person: "Locked camera" for `static`, "Follow" for `tracking`, and the plain name of each other move.
3. The harness adds the sentence after an empty line at the end of the prompt, after the sentences of the cast. The source record keeps the prompt without the sentence and `camera_move` with the id. So the same move reuses the file, another move makes a new file, and "Make a real video clip" starts on the move and the prompt of the clip that the scene shows.
4. `camera_move` or `last_frame_asset_id` with a capability other than `video` is the failure `invalid-value`. An unknown id is `camera-move-not-found`, with each id in the hint. The description of `camera_move` lists the ids, and tells the AI not to describe the camera in the prompt too.
5. The harness passes `last_frame_asset_id` as `last_frame_path` only when the model that the call uses (`chosenModel`) has `last_frame` in `accepts`. Otherwise the failure is `invalid-value` with "The video model `<id>` takes no last picture.", and the harness calls no tool. A server with no description gives no model, so it gets the same failure. The sample server accepts the last picture and ignores it.
6. The scene guide gets the part "Camera moves of a video clip", with each id and its line. Step 6 of the server instructions asks for a `camera_move` in each video call.
7. The sheet shows the moves as a row "Camera" above the prompt: "No camera move" (picked at the start), the six common moves (Push in, Pull out, Pan left, Orbit, Drone rise, Follow), and "10 more", which shows the rest in the same row with one click. A picked move stays in the row. The line of the picked move is under the row. Below 640 pixels, the row scrolls to the side.
8. The prompt that the sheet writes from a scene now ends with "Natural light." and not with "Slow camera move, natural light.", because the camera comes from the move.
9. "Let the AI write it" is a link next to the label of the prompt. It sends the fixed request `let-the-ai-make-the-clip` about the clip, with the sentence of the model that the sheet shows (document 15, S7). The sheet closes, and the chat shows the request.
10. "End on this picture" is under "Start on this picture", only for a model with `last_frame` in `accepts` that also takes a first picture. It is optional: "None" is picked at the start, and the sheet then sends no `last_frame_asset_id`.
11. Settings, group "Limits", has a number field "Real video in each project" in whole seconds from 0 to 3600, with "Save", and the used seconds of the project under it. `PUT /api/media/limits` with `{ "generated_video_seconds" }` writes `limits.generatedVideoSeconds` of the user file `media-tools.json` with a temporary file and a rename, and keeps each other field. `MediaTools.setVideoLimit` then reads the configuration again, so the next call uses the new limit with no restart. A limit in the `media-tools.json` of the project still wins; the answer gives the limit that applies, and the field then says that the project sets its own limit. The limit message of the sheet now points to Settings.
12. `project.json` gets `calm`. A project with no value is not calm. The edit `setLook` takes `calm?`, and keeps the value when it has none. `set_look` takes `look?` and `calm?`, at least one of them, and `get_project` gives `calm`.
13. `StagePageData` gets `calm`. With it, the stage page uses `calmKitScenesOf(look)` of `@yumekit/scene-kit`: the kit scenes with a pack whose `motion` has `calm: true` and a rise distance of 0. `useKitMotion` passes `calm` to `enter` and `drift`. So a kit scene fades in, and nothing drifts. A custom scene and the backdrops keep their motion.
14. Settings, group "This video", has the switch "Calm motion" with the line "Scenes fade in with no move." The switch calls `set_look` with only `calm`.
15. Two kit scenes call the motion functions with their own kind or distance, and not through `useKitMotion`: the words of `quote` rise by their own distance, and the dots of `bullet-list` pop. They keep a small move in a calm video until they pass `calm: motion.calm`. This change belongs to the work on the scenes of `packages/scene-kit/src/scenes/`. A bar that grows and the pan of `image-pan` stay, because they show the content.

## Details of the talking clips

The builder read the list of fal models at `api.fal.ai/v1/models` on 2026-11-23, then each model page, its `llms.txt` page, and its schema at `fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>`. This part builds the kind `talking-clip` of WP47.

1. The capability is `talking-clip` with the tool `generate_talking_clip`. It is in the list of capabilities of `@yumekit/tools`, in `defaults` of `media-tools.json`, and in the picker of Settings with the row "Talking clips". The picker has 7 rows now. The harness has no new tool, so it still has 46 tools. (WP57 of document 18 adds `replace_narration`, `replace_music`, and `set_project_name`, so the harness has 49 tools.)
2. `generate_talking_clip` takes `media_path` (a PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video of the person), `audio_path` (the voice: WAV, MP3, M4A, AAC, OGG, or FLAC), and the optional `prompt` (how the person moves). It returns one MP4 video file with the voice as its sound, about as long as the voice.
3. A talking model names what it takes in `accepts`: `image_input` or `video_input`, as a sharper model does. With no `model`, a server uses its default model when that model takes the kind of the file, or else the first model of its catalog that takes it. A model for the other kind is a failure before any request.
4. `generate_asset` with `talking-clip` needs `media_asset_id` (an image or video asset) and `voice_asset_id` (an audio asset). The optional `voice_part` is `{ start_seconds, duration_seconds, lead_seconds? }`. With it, the harness cuts that part of the voice file with the new `cutAudio` of `@yumekit/render`, puts `lead_seconds` of silence before it, and writes a 48 kHz WAV file to `.cache/voice-parts/<asset id>.wav` of the project. Document 01 lists `cutAudio`.
5. A missing voice is `asset-not-found` with the ids of the audio assets. A part that ends after the end of the voice file is `invalid-value`. `voice_asset_id` or `voice_part` with another capability is `invalid-value`. The source record keeps `media_asset_id`, `voice_asset_id`, and `voice_part`, so the same request reuses the earlier file.
6. A talking clip counts toward the limit of generated video. The requested seconds are `lead_seconds` plus `duration_seconds` of the part, or the length of the whole voice file. The result is a video asset made by a tool, so its seconds count as used seconds after the call.
7. `place_video` takes the new `quiet_voice`. With it, and only when the tool adds a sound clip, each voice clip under the sound of the video is cut in parts in the same batch: the part before keeps its level, the part under the video goes to -90 decibels, and the part after keeps its level. -90 decibels marks a turned-down part. Without `quiet_voice`, `place_video` puts each -90 decibel voice clip in its time back to 0 decibels, so the voice comes back when a plain clip replaces a talking clip. One undo reverts all of it.
8. The voice track of `quiet_voice` is the first audio track, other than `video-sound` and each `sounds` track, with a clip of an asset that has word timings. With none, it is a track named `narration` or `voice`. The editor uses the same rule for its voice row.
9. The editor shows "Make this person talk" under "Make a real video clip" in the group "Picture" of the scene panel, when the scene has someone who can talk: a person of the cast with a reference picture (the first one), the picture of the scene (the first image asset in its props, under a key with the word "asset"), or, for a video clip scene, the person of its talking clip or the video itself. The video of a scene is an addition to the design, because the catalog has models for video.
10. The button opens "Make a real video clip" in a talking mode, in its own sheet component next to the clip sheet: "Who talks" (each cast person, then the picture or the video of the scene), the voice with "Play" and its words, the talking models for the kind of the pick with their prices, the settings of the model, and the price and the limit of the clip sheet. The sheet starts on the talking pick of Settings when it takes the kind, or else on the default model.
11. The voice of a scene is the first voice clip in the current output that overlaps the scene clip, from the later of the two starts to the earlier of the two ends. When the voice starts after the scene, the silence before it becomes `lead_seconds`, so the lips stay in time with the voice. The words come from `get_asset_words` for a part of a longer voice file.
12. The sheet makes the clip, then calls `place_video` for each output that holds the scene clip, with `replace_clip_id`, `sound_gain_decibels` at the level of the voice clip (0 for a turned-down part), and `quiet_voice: true`. The clip takes the place and the length of the scene clip. When the voice is shorter than the scene, the clip holds its last picture.
13. With no voice clip under the scene, the sheet says "This scene has no voice yet." and shows "Record a voice line for this scene". That button sends the fixed request `record-a-voice-line`, "Record a voice line for this scene.", about the scene clip, and closes the sheet. The sheet then shows no price and no "Make the clip".
14. The sheet has no prompt field, because only some models take a motion prompt. The AI can send `prompt` in `input`.
15. The sample server gets `sample-talking-clip` ("Your picture or video with the voice"), with `tested: true` and `accepts` with `image_input` and `video_input`. It writes an MP4 at 24 frames per second with FFmpeg: the picture, or the video in a loop, with the voice as its sound, as long as the voice. The lips do not move.

Talking clip models of `tools/fal-media` (`generate_talking_clip`):

| Model                    | Id                                       | Takes   | Settings                | Price in the catalog, US dollars a second |
| ------------------------ | ---------------------------------------- | ------- | ----------------------- | ----------------------------------------- |
| HeyGen Avatar 6 Turbo    | `heygen/avatar-6/turbo/image-to-video`   | Picture | `resolution` 1080p, 2k  | 0.05 (1080p), 0.0875 (2k)                 |
| MiniMax H3 Max Lip Sync  | `minimax/h3-max/lip-sync/image-to-video` | Picture | `resolution` 480P to 2K | 0.05, 0.08, 0.16, 0.32                    |
| VEED Fabric 1.0          | `veed/fabric-1.0`                        | Picture | `resolution` 720p, 480p | 0.15 (720p), 0.08 (480p)                  |
| HeyGen Avatar 6          | `heygen/avatar-6/image-to-video`         | Picture | `resolution` 1080p, 2k  | 0.10 (1080p), 0.145 (2k)                  |
| Kling AI Avatar 2 Pro    | `fal-ai/kling-video/ai-avatar/v2/pro`    | Picture | None                    | 0.115                                     |
| sync-3 Avatar            | `fal-ai/sync-lipsync/v3/image-to-video`  | Picture | None                    | 0.1333                                    |
| PixVerse Lipsync         | `fal-ai/pixverse/lipsync`                | Video   | None                    | 0.04                                      |
| VEED Lipsync 2           | `veed/lipsync/v2`                        | Video   | None                    | 0.07                                      |
| HeyGen Lipsync Precision | `fal-ai/heygen/v3/lipsync/precision`     | Video   | None                    | 0.10                                      |
| sync-3 Lipsync           | `fal-ai/sync-lipsync/v3`                 | Video   | None                    | 0.1333 (the page gives 8 a minute)        |

16. HeyGen Avatar 6 Turbo is the default: it has the lowest price for each second of a picture model with no minimum length. The video models are in the order of their price, so PixVerse Lipsync is the model for a video when the call names none.
17. HeyGen Avatar 6 and its Turbo send `prompt` as `motion_prompt`, and Kling AI Avatar 2 Pro sends it as `prompt`. Each other model ignores it. MiniMax H3 Max Lip Sync defaults to 768P, and VEED Fabric 1.0 to 720p, because its schema requires a resolution. sync-3 Lipsync gets `sync_mode: "bounce"`, so a short video of the person plays forward and back for a longer voice. PixVerse Lipsync gets the voice file and no text.
18. MiniMax H3 Max Lip Sync needs a voice of at least 5 seconds. The server reads the length of a WAV voice file and rejects a shorter one before any request. The page adds a factor of 1.2 for a video over 15 seconds, and the estimate includes it.
19. `cost_usd` is the price for each second times the length of the returned MP4, or of the WAV voice when the MP4 gives none. Each model has `tested: false`. The test of check 5 sends the default of each setting of each model to a stub of fal and compares the body with the recorded schema.
20. Left out: the models that fal lists as deprecated (MuseTalk, the Infinitalk and Longcat avatars, AI Avatar, Hunyuan Portrait, FlashTalk), Wan 2.2 Speech-to-Video (fal retires it on 2027-01-04), the older sync lipsync versions (1.9, 2.0, 2.0 Pro, React-1), the first VEED Lipsync, Kling AI Avatar 1 and 2 Standard, Kling LipSync, HeyGen Avatar 4, HeyGen Lipsync Speed, and VEED Fabric 1.0 Fast (the catalog keeps one tier of each family where the price for each second is the same or close), the HeyGen Avatar 6 identity and reference video endpoints (they take an identity or a driving video, not a picture and a voice), and the LTX audio-to-video models (they make a new video from a voice and a prompt, not the given person).

## Details of WP64 prices

The builder of WP64 read these official price pages on 2026-11-24. Each price in the table is now in the catalog. A model that the table marks "Price not known" counts at the cautious price of document 15 ("Details of WP64", item 7).

| Server   | Model                                                                                            | Price in the catalog                                                                                            | Source                                                                  |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `gemini` | `lyria-3.5`                                                                                      | 0.08 US dollars for each song, unit `call`                                                                      | https://aistudio.google.com/docs/pricing ("Lyria 3.5 (Full Song)")      |
| `gemini` | `lyria-3-clip-preview`                                                                           | 0.04 for each song, unit `call`                                                                                 | https://aistudio.google.com/docs/pricing ("Lyria 3 Clip Preview (30s)") |
| `gemini` | Each picture model                                                                               | As in "Details of WP46". The page confirms each value. The tool now returns it as `cost_usd`                    | https://aistudio.google.com/docs/pricing                                |
| `fal`    | `google/nano-banana-2.1`                                                                         | 0.040 (1K), 0.059 (2K), 0.134 (4K) for each picture                                                             | https://fal.ai/models/google/nano-banana-2.1 ("representative costs")   |
| `openai` | `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, `gpt-image-2.6-flare`, `gpt-image-2.6-sunburst` | Price not known. The page gives only token prices (8 and 30 US dollars for one million image tokens in and out) | https://developers.openai.com/api/docs/pricing                          |
| `openai` | `gpt-4o-mini-tts`                                                                                | Price not known. The page gives only token prices, and no price for each minute                                 | https://developers.openai.com/api/docs/models/gpt-4o-mini-tts           |
| `fal`    | `openai/gpt-image-2.6/flare`, `minimax/h3-image`                                                 | Price not known. The pages give only token prices                                                               | https://fal.ai/models/minimax/h3-image/text-to-image/llms.txt           |
| `fal`    | Topaz, SeedVR2, FlashVSR+, Crystal                                                               | Price not known. The pages price by megapixel or by output resolution, which does not fit `MediaModelPrice`     | https://fal.ai/models/fal-ai/seedvr/upscale/video/llms.txt              |

1. `MediaModelPrice` gets the unit `call`: one price for each call, for example a song.
2. The fal page names the Nano Banana 2.1 values "representative costs" for a short prompt. The catalog uses them, because the tool reports them as an estimate.
3. `whisper-1` (0.006 for each minute) and `tts-1` and `tts-1-hd` (15 and 30 US dollars for one million characters) keep their prices. The page confirms them.
