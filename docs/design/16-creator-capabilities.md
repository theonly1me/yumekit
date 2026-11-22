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
