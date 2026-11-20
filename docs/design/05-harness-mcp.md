# 05 Harness MCP tools

The harness is one MCP server. Any MCP client can be the brain. Package: `@yumekit/harness-mcp`.

```ts
function createHarnessServer(options: {
  store: ProjectStore;
  mediaTools: MediaTools;
}): McpServer;
```

`yumekit mcp --project <folder>` opens the project, connects the media tools, and serves the harness over stdio.

## Rules for each tool

1. A tool states an intent. No tool reads or writes an arbitrary file.
2. A tool that changes the project builds edits and calls `applyEdits` one time. It has no other way to change files.
3. A result has `structuredContent` with the data and one short text line for a person.
4. A failure is a result with `isError: true` and `{ kind, message, hint }`. The hint tells the agent what to do next. One exception: when an input does not match the schema of a tool, the MCP SDK answers before the tool runs. That answer has a message that names the field, and no `kind`.
5. Each field name in a result uses `snake_case`, so an agent can send a result back as an input. Kit props keep the names of their schema.
6. A success result has the data as `structuredContent` and also as JSON text, because some clients show only text to the model.
7. Input names use `snake_case`. Time is in frames. A tool that takes seconds says so in the field name.
8. Each input has a schema with a description. The agent learns the tool from the schema, so the description states units and limits.

## Tools

### Read

| Tool               | Input       | Result                                                                                                                          |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `get_project`      | none        | Name, frame rate, outputs, script, bible, a list of scenes (id, title, kind), the length of each timeline, and the revision     |
| `get_scene`        | `scene_id`  | The scene record, and the code of a module scene                                                                                |
| `get_timeline`     | `output_id` | All tracks and clips of the output                                                                                              |
| `list_assets`      | `kind?`     | Each asset record. Word timings are not included                                                                                |
| `get_asset_words`  | `asset_id`  | The word timings of a speech asset, from `readAssetWords`                                                                       |
| `list_kit_scenes`  | none        | Each kit scene: name, purpose, and the schema of its props                                                                      |
| `get_scene_guide`  | none        | The reference for custom scene code: the contract, the hooks, the animation functions, the rules, and two examples              |
| `list_media_tools` | none        | Each connected media server, its capabilities, its description, and the state of each key, and `generated_video` of document 09 |

### Write the story

| Tool            | Input                                                                                         | Edit           |
| --------------- | --------------------------------------------------------------------------------------------- | -------------- |
| `set_script`    | `script`                                                                                      | `setScript`    |
| `set_bible`     | `style`, `palette`, `cast`, `voice`                                                           | `setBible`     |
| `add_output`    | `output_id`, `label`, `width_pixels`, `height_pixels`                                         | `addOutput`    |
| `remove_output` | `output_id`                                                                                   | `removeOutput` |
| `put_scene`     | `scene_id`, `title`, `notes?`, then either `kit_component` and `props`, or `code` and `props` | `putScene`     |
| `remove_scene`  | `scene_id`                                                                                    | `removeScene`  |

Before `put_scene` sends its edit, the harness checks the scene. For a kit scene, it validates the props against the schema from `@yumekit/scene-kit/schemas`. For a module scene, it calls `checkSceneCode` from `@yumekit/render`. If the check fails, the tool returns the compiler message and changes nothing.

### Timeline

| Tool              | Input                                                                                        | Edit                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `set_timeline`    | `output_id`, `tracks`                                                                        | `setTimeline`                                                                             |
| `add_clip`        | `output_id`, `track_id`, the clip fields                                                     | `addClip`                                                                                 |
| `update_clip`     | `output_id`, `clip_id`, the fields to change                                                 | `updateClip`                                                                              |
| `remove_clip`     | `output_id`, `clip_id`                                                                       | `removeClip`                                                                              |
| `copy_timeline`   | `from_output_id`, `to_output_id`                                                             | `copyTimeline`                                                                            |
| `place_narration` | `output_id`, `asset_id`, `start_frame`, `with_captions?`                                     | `addClip` for the audio, and `addClip` for a `caption-words` scene on the top scene track |
| `place_video`     | `output_id`, `asset_id`, `start_frame`, `duration_frames?`, `focus?`, `sound_gain_decibels?` | `putScene` for a `video-clip` scene, `addClip` for the scene, and `addClip` for the sound |
| `undo`, `redo`    | none                                                                                         | The store operation                                                                       |

`set_timeline` is the usual tool for a first build, because an agent can state the whole timeline in one call. The clip tools serve small changes. `update_clip` can also change the scene of a scene clip or the asset of an audio clip. So one output can show a different scene in the same place.

What the first agent run could not learn from the descriptions, and each description must now say:

- `list_media_tools` marks the sample server as a test server that draws the prompt as text and makes a tone for speech.
- `image-pan` cuts the image to the shape of the output, so a wide image loses its sides in a tall output.
- `image-pan` has its own caption at the top. It is not the narration caption.
- `place_narration` and `copy_timeline` name the tracks and the clip ids that they make.

`place_narration` puts a speech asset on the first audio track other than `video-sound`, for its full length. With `with_captions`, it also adds a `caption-words` scene and a clip that matches the audio clip, as document 08 requires. It creates the audio track and the caption track when the output has none. All of it is one edit batch, so one undo removes it.

`place_video` shows a video asset in an output, as document 09 says. The scene id is `video-` followed by the asset id. The scene clip goes on the first scene track that is not a caption track, or on a new scene track `scenes` below the others. The sound clip goes on the audio track `video-sound`, at -12 decibels by default, and is never longer than the video. `sound_gain_decibels` set to `off`, or an asset without `hasAudio`, adds no sound clip. All of it is one edit batch.

### Media

| Tool             | Input                                                                                                                                         | What it does                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `generate_asset` | `asset_id`, `capability` (`image`, `speech`, `music`, `video`), `server?`, `model?`, `input`, `reference_asset_ids?`, `first_frame_asset_id?` | Calls the media tool, then adds the asset with its source record                                   |
| `import_asset`   | `asset_id`, `kind`, `source_path`                                                                                                             | Copies a file of the user into the project and adds the asset                                      |
| `align_words`    | `asset_id`, `text`                                                                                                                            | Makes word timings for a speech asset that has none, and stores them with the edit `setAssetWords` |

`generate_asset` saves the tool name, the server and the model that `run` reports, the input, `costUsd`, and `costIsEstimate` in the asset record. With no `server`, the defaults of the media tools configuration apply. A repeated call reuses a file only when the model also matches, if the call names one.

For each server with a description, `list_media_tools` gives `label`, `runs`, `models`, and `keys`. Each key has `variable`, `label`, `get_key_url`, `steps`, and `source` (`environment`, `key-file`, or `missing`). It never gives a value. A server with a description that does not match the schema has `description_failure`. Before a call to a server with a missing key, `generate_asset` and `align_words` return `media-key-missing` with `server`, `variable`, `get_key_url`, and `steps`, and call no tool.

A media tool needs absolute file paths, and an agent knows only asset ids. So `reference_asset_ids` becomes `reference_image_paths` in the tool input, and `first_frame_asset_id` becomes `first_frame_path`. An id that is not an image asset is the failure `asset-not-found`, the same kind as each other asset lookup.

For a video, `generate_asset` reads `hasAudio` with `probeMedia`. It uses the size and the length of the probe only when the server reports none. Before a video call, it checks the limit `limits.generatedVideoSeconds` of document 09. A call past the limit is the failure `generated-video-limit-reached` with `used_seconds`, `requested_seconds`, and `limit_seconds`, and the harness calls no tool. `list_assets` shows `has_audio` for a video asset.

`import_asset` reads the kind, the size, and the length of the file with `probeMedia` from `@yumekit/render`. So it accepts image, audio, video, and font files. If a speech tool returns word timings, the harness stores them in the same edit. If two calls have the same capability, server, and input, the second call reuses the file of the first and does not call the tool.

### See the result

| Tool             | Input                                    | Result                         |
| ---------------- | ---------------------------------------- | ------------------------------ |
| `preview_frame`  | `output_id`, `frame`, `scale?`           | One PNG image as image content |
| `preview_frames` | `output_id`, `frames` (1 to 8), `scale?` | One image for each frame       |

The default scale is 0.25. An agent uses these tools after each scene and before each render. It checks layout, text that does not fit, and missing images.

### Finish

| Tool           | Input                                                 | Result                                                                        |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `render_video` | `output_id`, `first_frame?`, `frame_count?`, `scale?` | The path of the MP4 in `renders/`, the frame count, and the length in seconds |
| `render_still` | `output_id`, `frame`                                  | The path of the PNG in `renders/`                                             |

`render_video` sends MCP progress notifications while it works. In milestone 1 it returns when the file is complete.

## Server instructions

The server sends these instructions to the client at the start of a session. They give the order of work:

1. Call `get_project`, `list_kit_scenes`, and `list_media_tools`.
2. Write the script with `set_script` and the style with `set_bible`.
3. Add each scene with `put_scene`. Prefer a kit scene. Call `get_scene_guide` before you write custom code.
4. Make the narration with `generate_asset`. Read the word timings to set the length of each scene.
5. Make the images with `generate_asset`. Put the style of the bible in each prompt.
6. For a shot that code cannot draw, make a still image first. Check it with the person or with `preview_frame`. Then call `generate_asset` with the capability `video` and `first_frame_asset_id`, and add the clip with `place_video`.
7. Build the timeline with `set_timeline`, one output at a time. Add each narration with `place_narration`. Use `copy_timeline` for the next output, then change it.
8. Check frames with `preview_frames`. Correct each scene that has a defect.
9. Call `render_video` for each output.

## What the harness does not do

- It does not run shell commands for the agent.
- It does not hold API keys. A media server reads its own key from its environment, which `@yumekit/tools` fills from the key file of document 10. No harness tool reads, sets, or removes a key.
- It does not choose a model. The MCP client is the brain.

## Tests

1. Each tool has a test through a real MCP client connected to the server in the same process.
2. The tests use the sample media server from document 06. No test calls a paid service.
3. One test builds a complete small project with tool calls only: script, two scenes, speech, timeline, preview, and a 30 frame render at scale 0.25. It then checks the video with `ffprobe`.
4. Each failure path that has a hint has a test that reads the hint.
