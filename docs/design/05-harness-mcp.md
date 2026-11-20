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
4. A failure is a result with `isError: true` and `{ kind, message, hint }`. The hint tells the agent what to do next.
5. Input names use `snake_case`. Time is in frames. A tool that takes seconds says so in the field name.
6. Each input has a schema with a description. The agent learns the tool from the schema, so the description states units and limits.

## Tools

### Read

| Tool               | Input       | Result                                                                                                                      |
| ------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `get_project`      | none        | Name, frame rate, outputs, script, bible, a list of scenes (id, title, kind), the length of each timeline, and the revision |
| `get_scene`        | `scene_id`  | The scene record, and the code of a module scene                                                                            |
| `get_timeline`     | `output_id` | All tracks and clips of the output                                                                                          |
| `list_assets`      | `kind?`     | Each asset record. Word timings are not included                                                                            |
| `get_asset_words`  | `asset_id`  | The word timings of a speech asset                                                                                          |
| `list_kit_scenes`  | none        | Each kit scene: name, purpose, and the schema of its props                                                                  |
| `get_scene_guide`  | none        | The reference for custom scene code: the contract, the hooks, the animation functions, the rules, and two examples          |
| `list_media_tools` | none        | Each connected media server and its capabilities                                                                            |

### Write the story

| Tool            | Input                                                                                         | Edit           |
| --------------- | --------------------------------------------------------------------------------------------- | -------------- |
| `set_script`    | `script`                                                                                      | `setScript`    |
| `set_bible`     | `style`, `palette`, `cast`, `voice`                                                           | `setBible`     |
| `add_output`    | `output_id`, `label`, `width_pixels`, `height_pixels`                                         | `addOutput`    |
| `remove_output` | `output_id`                                                                                   | `removeOutput` |
| `put_scene`     | `scene_id`, `title`, `notes?`, then either `kit_component` and `props`, or `code` and `props` | `putScene`     |
| `remove_scene`  | `scene_id`                                                                                    | `removeScene`  |

Before `put_scene` sends its edit, the harness checks the scene. For a kit scene, it validates the props against the schema of the component. For a module scene, it compiles the code and checks the imports. If the check fails, the tool returns the compiler message and changes nothing.

### Timeline

| Tool            | Input                                        | Edit                |
| --------------- | -------------------------------------------- | ------------------- |
| `set_timeline`  | `output_id`, `tracks`                        | `setTimeline`       |
| `add_clip`      | `output_id`, `track_id`, the clip fields     | `addClip`           |
| `update_clip`   | `output_id`, `clip_id`, the fields to change | `updateClip`        |
| `remove_clip`   | `output_id`, `clip_id`                       | `removeClip`        |
| `copy_timeline` | `from_output_id`, `to_output_id`             | `copyTimeline`      |
| `undo`, `redo`  | none                                         | The store operation |

`set_timeline` is the usual tool for a first build, because an agent can state the whole timeline in one call. The clip tools serve small changes.

### Media

| Tool             | Input                                                                              | What it does                                                     |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `generate_asset` | `asset_id`, `capability` (`image`, `speech`, `music`, `video`), `server?`, `input` | Calls the media tool, then adds the asset with its source record |
| `import_asset`   | `asset_id`, `kind`, `source_path`                                                  | Copies a file of the user into the project and adds the asset    |
| `align_words`    | `asset_id`, `text`                                                                 | Makes word timings for a speech asset that has none              |

`generate_asset` saves the tool name, the server, and the input in the asset record. If a speech tool returns word timings, the harness stores them in the same edit. If two calls have the same capability, server, and input, the second call reuses the file of the first and does not call the tool.

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
6. Build the timeline with `set_timeline`, one output at a time. Use `copy_timeline` for the next output, then change it.
7. Check frames with `preview_frames`. Correct each scene that has a defect.
8. Call `render_video` for each output.

## What the harness does not do

- It does not run shell commands for the agent.
- It does not hold API keys. A media server reads its own key from its environment.
- It does not choose a model. The MCP client is the brain.

## Tests

1. Each tool has a test through a real MCP client connected to the server in the same process.
2. The tests use the sample media server from document 06. No test calls a paid service.
3. One test builds a complete small project with tool calls only: script, two scenes, speech, timeline, preview, and a 30 frame render at scale 0.25. It then checks the video with `ffprobe`.
4. Each failure path that has a hint has a test that reads the hint.
