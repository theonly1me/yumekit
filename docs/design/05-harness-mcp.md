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
7. Input names use `snake_case`. Time is in frames. A tool that takes seconds says so in the field name. With a tempo, each frame input of a timeline or clip tool also has a twin in beats (document 19).
8. Each input has a schema with a description. The agent learns the tool from the schema, so the description states units and limits.

## Tools

### Read

| Tool               | Input       | Result                                                                                                                                                                            |
| ------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_project`      | none        | Name, frame rate, `video_style`, look, calm, outputs with their `platforms`, script, bible, a list of scenes (id, title, kind), the length of each timeline, and the revision     |
| `get_scene`        | `scene_id`  | The scene record, and the code of a module scene                                                                                                                                  |
| `get_timeline`     | `output_id` | All tracks and clips of the output, with `off` for each track                                                                                                                     |
| `list_assets`      | `kind?`     | Each asset record. Word timings are not included                                                                                                                                  |
| `get_asset_words`  | `asset_id`  | The word timings of a speech asset, from `readAssetWords`                                                                                                                         |
| `list_kit_scenes`  | none        | Each kit scene: name, purpose, and the schema of its props, and each look with one line                                                                                           |
| `get_scene_guide`  | none        | The reference for custom scene code: the contract, the hooks, the animation functions, the rules, Motion design (document 17), the camera moves (document 16), and three examples |
| `list_media_tools` | none        | Each connected media server, its capabilities, its description, and the state of each key, and `generated_video` of document 09                                                   |

### Write the story

| Tool                 | Input                                                                                         | Edit                                                    |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `set_script`         | `script`                                                                                      | `setScript`                                             |
| `set_project_name`   | `name` (1 to 40 characters, document 18)                                                      | `setProjectName`                                        |
| `set_bible`          | `style`, `palette`, `cast`, `voice`                                                           | `setBible`                                              |
| `set_look`           | `look?`, `calm?` (one or both)                                                                | `setLook`                                               |
| `put_cast_member`    | `cast_id`, `kind`, `name`, `description`, `reference_asset_ids?` (document 16, N3)            | `setBible`                                              |
| `remove_cast_member` | `cast_id`                                                                                     | `setBible`                                              |
| `add_output`         | `output_id`, `label`, `width_pixels`, `height_pixels`                                         | `addOutput`                                             |
| `remove_output`      | `output_id`                                                                                   | `removeOutput`                                          |
| `add_platform`       | `platform_id`                                                                                 | `setOutputPlatforms`, or `addOutput` and `copyTimeline` |
| `remove_platform`    | `platform_id`                                                                                 | `setOutputPlatforms`, or `removeOutput`                 |
| `put_scene`          | `scene_id`, `title`, `notes?`, then either `kit_component` and `props`, or `code` and `props` | `putScene`                                              |
| `remove_scene`       | `scene_id`                                                                                    | `removeScene`                                           |
| `set_video_style`    | `video_style` (`graphics`, `ai-video`, `mix`)                                                 | `setVideoStyle`                                         |
| `set_tempo`          | `tempo` (60 to 200, document 19)                                                              | `setTempo`                                              |
| `put_shared_code`    | `name`, `code` (document 19)                                                                  | `putSharedCode`                                         |
| `set_fonts`          | `fonts` with `asset_id`, `family`, `weight?`, `style?` (document 19)                          | `setFonts`                                              |

`set_video_style` follows the section "The video style" of document 15. `get_project` gives `graphics` for a project with no value. The descriptions of both tools say what each style means, and tell the agent to change the style only when the person asks.

`add_platform` and `remove_platform` follow the section "Platforms" of document 13. Each call is one `applyEdits` call, so it is one undo step. `add_output` is for a custom size. The descriptions of `add_output` and `add_platform` tell an agent this.

- `add_platform` puts the platform on the output that has its size. With no such output, it adds the output of the catalog, with the id and the size of the platform, and copies the timeline of the output with the nearest ratio of width to height. The distance is the difference of the two ratios. On a tie, the first output in project order wins.
- `add_platform` changes nothing for a platform that an output has. It returns that `output_id` and the current revision.
- `remove_platform` returns `not-found` when no output has the platform.

Before `put_scene` sends its edit, the harness checks the scene. For a kit scene, it validates the props against the schema from `@yumekit/scene-kit/schemas`. For a module scene, it calls `checkSceneCode` from `@yumekit/render`. If the check fails, the tool returns the compiler message and changes nothing.

### Timeline

| Tool                | Input                                                                                                                                                    | Edit                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `set_timeline`      | `output_id`, `tracks`, `remove_person_work?`                                                                                                             | `setTimeline`                                                                                                                                                                  |
| `add_clip`          | `output_id`, `track_id`, the clip fields                                                                                                                 | `addClip`                                                                                                                                                                      |
| `update_clip`       | `output_id`, `clip_id`, the fields to change                                                                                                             | `updateClip`                                                                                                                                                                   |
| `remove_clip`       | `output_id`, `clip_id`, `remove_person_work?`                                                                                                            | `removeClip`                                                                                                                                                                   |
| `copy_timeline`     | `from_output_id`, `to_output_id`, `remove_person_work?`                                                                                                  | `copyTimeline`                                                                                                                                                                 |
| `place_narration`   | `output_id`, `asset_id`, `start_frame`, `with_captions?`, `partial?`                                                                                     | `addClip` for the audio, and `addClip` for a `caption-words` scene on the top scene track                                                                                      |
| `place_video`       | `output_id`, `asset_id`, `start_frame?`, `duration_frames?`, `replace_clip_id?`, `focus?`, `sound_gain_decibels?`, `quiet_voice?`, `remove_person_work?` | `removeClip` for a replaced clip, `putScene` for a `video-clip` scene, `addClip` for the scene, `addClip` for the sound, and `updateClip` and `addClip` for the voice under it |
| `place_sound`       | `output_id`, `asset_id`, `start_frame`, `gain_decibels?`                                                                                                 | `setTimeline` for a new `sounds` track, and `addClip` for the sound                                                                                                            |
| `replace_narration` | `text?`, `voice?`, `server?`, `model?`, `pronunciations?`, `asset_id?`, `output_ids?`, `with_captions?`                                                  | `addAsset` from `generate_asset`, `putScene` for the captions, and `setTimeline` for each output                                                                               |
| `replace_music`     | `prompt?` or `asset_id?`, `server?`, `model?`, `gain_decibels?`, `output_ids?`                                                                           | `addAsset` from `generate_asset`, and `setTimeline` for each output                                                                                                            |
| `undo`, `redo`      | none                                                                                                                                                     | The store operation                                                                                                                                                            |

`set_timeline` is the tool for a first build, because an agent can state the whole timeline in one call. For a later change, the agent uses the smallest tool: `replace_narration`, `replace_music`, or a clip tool (document 18, F12). `set_timeline`, `copy_timeline`, `remove_clip`, and `place_video` refuse a call of an agent that would remove what the person made, with `would-remove-the-work-of-the-person` (document 18, F11). The clip tools serve small changes. `update_clip` can also change the scene of a scene clip or the asset of an audio clip. So one output can show a different scene in the same place.

What the first agent run could not learn from the descriptions, and each description must now say:

- `list_media_tools` marks the sample server as a test server that draws the prompt as text and makes a tone for speech.
- `image-pan` cuts the image to the shape of the output, so a wide image loses its sides in a tall output.
- `image-pan` has its own caption at the top. It is not the narration caption.
- `place_narration` and `copy_timeline` name the tracks and the clip ids that they make.

`place_narration` puts a speech asset on the first audio track other than `video-sound`, for its full length. A voice shorter than two thirds of the video fails with `narration-too-short`, unless the call gives `partial: true`. A voice of the server `sample` gets no captions. `set_timeline` and `copy_timeline` keep the transition of a clip with the same id when the call gives none, and give `kept_transitions`. `get_project` gives `voice_matches_script`. Document 18 has the rules of these four points. With `with_captions`, it also adds a `caption-words` scene and a clip that matches the audio clip, as document 08 requires. It creates the audio track and the caption track when the output has none. All of it is one edit batch, so one undo removes it.

`quiet_voice` follows "Details of the talking clips" of document 16.

`place_sound` puts an audio asset, usually a sound effect, on the track `sounds` of an output, as document 16 says in "Details of WP47". `place_narration` never uses a `sounds` track.

`place_video` shows a video asset in an output, as document 09 says. The scene id is `video-` followed by the asset id. The scene clip goes on the first scene track that is not a caption track, or on a new scene track `scenes` below the others. The sound clip goes on the audio track `video-sound`, at -12 decibels by default, and is never longer than the video. `sound_gain_decibels` set to `off`, or an asset without `hasAudio`, adds no sound clip. With `replace_clip_id`, the tool removes that scene clip, and the sound clip of its video when the clip shows a `video-clip` scene. The video then starts at the start frame of that clip with its length, unless `start_frame` or `duration_frames` are given. A call needs `start_frame` or `replace_clip_id`. All of it is one edit batch, so one undo brings back the replaced clip.

### Direct changes to scenes

| Tool                   | Input                                                  | Edit                                                                |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `resize_scene_clip`    | `output_ids?`, `clip_id`, `duration_frames`            | `setTimeline` for each changed output                               |
| `move_scene_clip`      | `output_ids?`, `clip_id`, `to_index`                   | `setTimeline` for each changed output                               |
| `remove_scene_clip`    | `output_ids?`, `clip_id`                               | `setTimeline` for each changed output                               |
| `duplicate_scene_clip` | `output_ids?`, `clip_id`                               | `putScene` for each copy, and `setTimeline` for each changed output |
| `set_track_off`        | `output_ids?`, `track_id`, `off`                       | `setTimeline` for each changed output                               |
| `set_transitions`      | `output_ids?`, `clip_ids?`, `kind`, `duration_frames?` | `setTimeline` for each changed output                               |

The four scene clip tools change the scenes row of document 03, as document 13 says in "Direct changes to scenes". With no `output_ids`, a tool changes each output that has a clip with `clip_id` on its scenes row. Only the clips of the row move. Each tool is one edit batch, so one undo reverts the change in each output. The result has `output_ids`, `scenes_rows`, and `voice_may_not_match`. It is `true` when a changed output has an audio clip of an asset with word timings. The descriptions tell the agent to use these tools in place of `update_clip` and `remove_clip` to change the length, the order, or the set of scenes.

`set_track_off` switches a track off or on in each output that has it. `get_timeline` shows `off` for each track, and `set_timeline` accepts it.

`set_transitions` sets the transition of document 17 on the clips of the scenes row. The section "Details of WP51" of document 17 gives its rules.

### Media

| Tool             | Input                                                                                                                                                                                                                                                                                              | What it does                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `generate_asset` | `asset_id`, `capability` (`image`, `speech`, `music`, `video`, `sound-effect`, `talking-clip`, `sharper`), `server?`, `model?`, `input`, `reference_asset_ids?`, `cast_ids?`, `first_frame_asset_id?`, `last_frame_asset_id?`, `camera_move?`, `media_asset_id?`, `voice_asset_id?`, `voice_part?` | Calls the media tool, then adds the asset with its source record                                   |
| `import_asset`   | `asset_id`, `kind`, `source_path`, `original_name?`, `marks?`                                                                                                                                                                                                                                      | Copies a file of the user into the project and adds the asset                                      |
| `remove_asset`   | `asset_id`                                                                                                                                                                                                                                                                                         | Removes the record of an asset that nothing uses, with the edit `removeAsset`. The file stays      |
| `mark_asset`     | `asset_id`, `name`, `region?`, `seconds?`, `remove?`                                                                                                                                                                                                                                               | Adds, replaces, or removes one named region and time of a video or image asset (document 19)       |
| `align_words`    | `asset_id`, `text`                                                                                                                                                                                                                                                                                 | Makes word timings for a speech asset that has none, and stores them with the edit `setAssetWords` |

`generate_asset` saves the tool name, the server and the model that `run` reports, the input, `costUsd`, and `costIsEstimate` in the asset record. With no `server`, the defaults of the media tools configuration apply. A repeated call reuses a file only when the model also matches, if the call names one.

For each server with a description, `list_media_tools` gives `label`, `runs`, `models`, and `keys`. Each key has `variable`, `label`, `get_key_url`, `steps`, and `source` (`environment`, `key-file`, or `missing`). It never gives a value. A server with a description that does not match the schema has `description_failure`. Before a call to a server with a missing key, `generate_asset` and `align_words` return `media-key-missing` with `server`, `variable`, `get_key_url`, and `steps`, and call no tool.

A media tool needs absolute file paths, and an agent knows only asset ids. So `reference_asset_ids` becomes `reference_image_paths` in the tool input, `first_frame_asset_id` becomes `first_frame_path`, and `last_frame_asset_id` becomes `last_frame_path`. An id that is not an image asset is the failure `asset-not-found`, the same kind as each other asset lookup.

For a video, `generate_asset` reads `hasAudio` with `probeMedia`. It uses the size and the length of the probe only when the server reports none. Before a video call, it checks the limit `limits.generatedVideoSeconds` of document 09. A call past the limit is the failure `generated-video-limit-reached` with `used_seconds`, `requested_seconds`, and `limit_seconds`, and the harness calls no tool. `list_assets` shows `has_audio` for a video asset.

`remove_asset` checks the uses of the asset with `assetUsesOf` from `@yumekit/project`: each scene whose props name the asset, each audio clip, and each cast member. If one exists, the failure is `asset-in-use`, and its message names each use. The tool changes nothing then. Otherwise it is one edit, so one undo brings the asset back. The file stays in `assets/files/`, because undo never restores a media file (document 03).

`camera_move` and `last_frame_asset_id` follow "Details of WP41" of document 16. `media_asset_id` and the capabilities `sound-effect` and `sharper` follow "Details of WP47" of document 16. The capability `talking-clip`, `voice_asset_id`, and `voice_part` follow "Details of the talking clips" of document 16.

`import_asset` keeps `original_name` as `originalName` of the record. With no value, it keeps the last part of `source_path`.

`import_asset` reads the kind, the size, and the length of the file with `probeMedia` from `@yumekit/render`. So it accepts image, audio, video, and font files. If a speech tool returns word timings, the harness stores them in the same edit. If two calls have the same capability, server, and input, the second call reuses the file of the first and does not call the tool.

### See the result

| Tool             | Input                                                   | Result                                                             |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `preview_frame`  | `output_id`, `frame`, `scale?`                          | One PNG image as image content                                     |
| `preview_frames` | `output_id`, `frames` (1 to 8), `scale?`                | One image for each frame                                           |
| `preview_scenes` | `output_id`, `scene_ids` (1 to 8), `scale?`, `frame?`   | One image for each scene                                           |
| `contact_sheet`  | `output_id`, `every_seconds?`, `columns?`, `beat_cuts?` | One image of the whole video, and a list of warnings (document 19) |

`preview_scenes` draws each scene alone, at the size of the output. A scene needs no clip for it. The harness draws the scene as a clip of 3 seconds and takes the frame that is 75% into it, where kit motion has settled. `frame` takes another frame of that clip instead, for example 10 for the entry, and a frame past the end gives the last frame. An unknown scene id is the failure `scene-not-found`.

The default scale is 0.25. An agent uses these tools after each scene and before each render. It checks layout, text that does not fit, and missing images.

### Finish

| Tool                | Input                                                       | Result                                                                                                                                |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `render_video`      | `output_id`, `first_frame?`, `frame_count?`, `scale?`       | The path of the MP4 in `renders/` as `file`, `files` with one entry for each file, the frame count, and the length in seconds         |
| `render_still`      | `output_id`, `frame`                                        | The path of the PNG in `renders/`                                                                                                     |
| `make_sharper_copy` | `output_id`, `platform_ids?`, `scale?`, `server?`, `model?` | `files` with the path of each `renders/<name>-sharper.mp4`, the server, the model, the size, and `cost_usd` when the server gives one |

An output with platforms renders once to `renders/<project name>-<platform id>.mp4` for its first platform in catalog order. Each other platform gets a hard link to that file, or a copy when the link fails. Each entry of `files` has `file` and `platform_id`. `file` is the first file. An output with no platform writes `renders/<output id>.mp4`, and its one entry has no `platform_id`.

The project name in a file name is in lower case. Each run of characters that are not a letter or a digit becomes one hyphen. The name has at most 64 characters, with no hyphen at the start or the end. An empty result becomes `video`.

`render_video` sends MCP progress notifications while it works. In milestone 1 it returns when the file is complete.

## Server instructions

The server sends these instructions to the client at the start of a session. They give the order of work:

1. Call `get_project`, `list_kit_scenes`, and `list_media_tools`.
2. Write the script with `set_script` and the style with `set_bible`.
3. Add each scene with `put_scene`. Prefer a kit scene. Call `get_scene_guide` before you write custom code, and follow its part Motion design. Check each new scene with `preview_scenes` twice: with frame 10 for its entry, and with no frame for its settled picture.
4. Make the narration with `generate_asset`. Read the word timings to set the length of each scene.
5. Make the images with `generate_asset`. Put the style of the bible in each prompt.
6. For a shot that code cannot draw, make a still image first. Check it with the person or with `preview_frame`. Then call `generate_asset` with the capability `video`, `first_frame_asset_id`, and a `camera_move`, and add the clip with `place_video`.
7. Build the timeline with `set_timeline`, one output at a time. Add each narration with `place_narration`. Use `copy_timeline` for the next output, then change it. Call `set_transitions` once for the whole video, not once for each clip. Where a moment needs a sound, make it with `generate_asset` and the capability `sound-effect`, and add it with `place_sound`.
8. Check the whole video with one call of `contact_sheet` after each build of a timeline. Correct each warning and each scene that has a defect. Use `preview_frames` for a close look at one moment.
9. Call `render_video` for each output.

After the list, the instructions say: change a finished video with the smallest tool (`replace_narration`, `replace_music`, `update_clip`), write the whole timeline only for a new video, and give `remove_person_work` only when the person asked for that removal.

## What the harness does not do

- It does not run shell commands for the agent.
- It does not hold API keys. A media server reads its own key from its environment, which `@yumekit/tools` fills from the key file of document 10. No harness tool reads, sets, or removes a key.
- It does not choose a model. The MCP client is the brain.

## Tests

1. Each tool has a test through a real MCP client connected to the server in the same process.
2. The tests use the sample media server from document 06. No test calls a paid service.
3. One test builds a complete small project with tool calls only: script, two scenes, speech, timeline, preview, and a 30 frame render at scale 0.25. It then checks the video with `ffprobe`.
4. Each failure path that has a hint has a test that reads the hint.
