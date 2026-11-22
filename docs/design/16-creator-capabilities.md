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
