# 06 Media tools

A media tool is an MCP server that makes or changes media. The user chooses which servers to connect. Package `@yumekit/tools` is the MCP client side. Each bundled server is a folder in `tools/`.

## Two ways to use a media server

1. **Through the harness.** A server that follows the convention below works with `generate_asset` and `align_words`. The harness records the source of each asset, reuses a file for a repeated request, and later gives the editor a "make again" button.
2. **Through the brain.** The user can connect any MCP server to their own agent. The agent calls it, saves the file, and then calls `import_asset`. This needs no convention.

## Configuration

yumekit reads two files with the same shape. The project file wins for a server with the same name.

- User: `~/.config/yumekit/media-tools.json`
- Project: `<project>/media-tools.json`

```json
{
  "mcpServers": {
    "openai": {
      "command": "yumekit-openai-media",
      "args": [],
      "passEnvironment": ["OPENAI_API_KEY"]
    },
    "sample": { "command": "yumekit-sample-media", "args": [] }
  },
  "defaults": { "image": "openai", "speech": "openai", "align": "openai" }
}
```

- `passEnvironment` lists the names of environment variables that the server gets. The file never holds a secret value.
- `defaults` names the server for each capability when a tool call gives no server.
- The `yumekit` command passes the commands of the bundled servers as `bundledServers`. A file can use a bundled server by its name with no `command`.
- With no file, yumekit connects only the bundled sample server.

## The convention

A server has a capability when it lists a tool with the name in this table. Wire names use `snake_case`. Time on the wire is in seconds, because a media server does not know the frame rate. The harness converts to frames.

| Capability | Tool name         | Required input                                                | Optional input                                                                     |
| ---------- | ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `image`    | `generate_image`  | `prompt`, `output_directory`, `file_stem`                     | `width_pixels`, `height_pixels`, `reference_image_paths`, `transparent_background` |
| `speech`   | `generate_speech` | `text`, `output_directory`, `file_stem`                       | `voice`, `instructions`, `speed`                                                   |
| `align`    | `align_words`     | `audio_path`, `text`                                          | `language`                                                                         |
| `music`    | `generate_music`  | `prompt`, `duration_seconds`, `output_directory`, `file_stem` |                                                                                    |
| `video`    | `generate_video`  | `prompt`, `duration_seconds`, `output_directory`, `file_stem` | `first_frame_path`, `width_pixels`, `height_pixels`                                |

A server can accept more optional inputs. The harness passes unknown fields of `input` to the tool unchanged.

Each tool returns `structuredContent` in this shape:

```ts
type MediaToolResult = {
  files: {
    path: string;
    kind: "image" | "audio" | "video";
    width_pixels?: number;
    height_pixels?: number;
    duration_seconds?: number;
  }[];
  words?: { text: string; start_seconds: number; end_seconds: number }[];
  cost_usd?: number;
};
```

Rules for a server:

1. Write each file inside `output_directory` with a name that starts with `file_stem`. Return the absolute path.
2. Return a failure as a result with `isError: true` and a message that a person can act on, for example "OPENAI_API_KEY is not set".
3. Never write outside `output_directory`.
4. `align_words` writes no file. It returns `files: []` and `words`.

The harness validates each result against the schema. A result that does not match is the failure `media-tool-invalid-result`, with the server name and the schema error.

## Client interface

```ts
type Capability = "image" | "speech" | "align" | "music" | "video";

type MediaTools = {
  list: () => { server: string; capabilities: Capability[] }[];
  run: (request: {
    capability: Capability;
    server?: string;
    input: JsonObject;
    outputDirectory: string;
    fileStem: string;
  }) => Promise<Outcome<MediaToolResult, MediaToolFailure>>;
  close: () => Promise<void>;
};

type ServerCommand = {
  command: string;
  args: string[];
  passEnvironment?: string[];
};

function connectMediaTools(options: {
  projectFolder: string;
  bundledServers: { [name: string]: ServerCommand };
}): Promise<MediaTools>;
```

`MediaToolFailure` kinds: `no-server-for-capability`, `server-not-found`, `server-failed-to-start`, `media-tool-failed` (with the message of the server), `media-tool-invalid-result`, `media-tool-timeout`.

A server that fails to start does not stop the others. `list` shows only the servers that started, and `yumekit mcp` prints the reason for each one that did not.

## Bundled servers in milestone 1

| Folder               | Capabilities                        | Cost                                 | Notes                                             |
| -------------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------- |
| `tools/sample-media` | `image`, `speech`, `align`, `music` | Free, no network                     | Made for tests and for work on yumekit. See below |
| `tools/openai-media` | `image`, `speech`, `align`          | The OpenAI API key of the user       | Reads `OPENAI_API_KEY`                            |
| `tools/codex-images` | `image`                             | The ChatGPT plan of the user, no key | Runs the `codex` CLI of the user                  |

### `tools/sample-media`

The sample server gives the same file for the same input, with no model.

- `generate_image` draws a PNG with a color from a hash of the prompt and the prompt as text.
- `generate_speech` writes a WAV file with a quiet tone. Its length is 0.3 seconds for each word. It returns word timings that divide the length evenly.
- `align_words` returns even word timings over the length of the audio file.
- `generate_music` writes a WAV file with a low tone of the requested length.

### `tools/openai-media`

The builder reads the current OpenAI API documents before any code. OpenAI retires models often, so the documents decide the model names. Each model name is one constant with a way to override it from an environment variable. `align_words` uses a transcription model that returns word timestamps. `cost_usd` comes from the usage data of the response when the API gives it.

### `tools/codex-images`

The server asks the `codex` CLI to make an image with the built-in image tool of Codex, then copies the file to `output_directory`. The builder first confirms in the Codex documents that a non-interactive run can make an image on a ChatGPT plan. If the documents do not support it, the builder reports that and does not ship a workaround.

## Tests

1. The client tests start the sample server as a real child process and call each capability.
2. A fake server with a wrong result shape proves the failure `media-tool-invalid-result`.
3. A server command that does not exist proves `server-failed-to-start` and that other servers still work.
4. Tests of `openai-media` and `codex-images` replace the network call and the `codex` process at that outside boundary. They never spend money. One manual check for each server, with a real key or plan, goes in the pull request evidence.
