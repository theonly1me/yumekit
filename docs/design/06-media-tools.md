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

| Capability | Tool name         | Required input                                                | Optional input                                                                                                |
| ---------- | ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `image`    | `generate_image`  | `prompt`, `output_directory`, `file_stem`                     | `width_pixels`, `height_pixels`, `reference_image_paths`, `transparent_background`                            |
| `speech`   | `generate_speech` | `text`, `output_directory`, `file_stem`                       | `voice`, `instructions`, `speed`                                                                              |
| `align`    | `align_words`     | `audio_path`, `text`                                          | `language`                                                                                                    |
| `music`    | `generate_music`  | `prompt`, `duration_seconds`, `output_directory`, `file_stem` |                                                                                                               |
| `video`    | `generate_video`  | `prompt`, `duration_seconds`, `output_directory`, `file_stem` | `first_frame_path`, `last_frame_path`, `reference_image_paths`, `width_pixels`, `height_pixels`, `with_audio` |

Document 09 has the rules for a video server.

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
  }) => Promise<
    Outcome<{ server: string; result: MediaToolResult }, MediaToolFailure>
  >;
  failedServers: () => { server: string; message: string }[];
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
  toolTimeoutSeconds?: number;
}): Promise<Outcome<MediaTools, ConnectFailure>>;

type ConnectFailure = {
  kind: "invalid-configuration-file";
  file: string;
  message: string;
};
```

`MediaToolFailure` kinds: `no-server-for-capability`, `server-not-found`, `server-failed-to-start`, `media-tool-failed` (with the message of the server), `media-tool-invalid-result`, `media-tool-timeout`.

A server that fails to start does not stop the others. `list` shows only the servers that started. `failedServers` gives the reason for each one that did not, and `yumekit mcp` prints those reasons.

A configuration file that is not valid is the failure `invalid-configuration-file`, with the file path and the schema error. `connectMediaTools` starts no server in that case.

`toolTimeoutSeconds` is the limit for one tool call. The default is 600. A call that passes the limit is the failure `media-tool-timeout`.

`run` returns the name of the server that it used, so a caller can record the source of an asset.

How `run` selects a server:

1. It uses `server` from the request. If the request has none, it uses the entry of `defaults` for the capability.
2. If neither names a server, it uses the first started server, in configuration order, that has the capability.
3. A name that no file defines is `server-not-found`. A server that started without the tool is `no-server-for-capability`.

How the files merge:

- An entry with no `command` uses the bundled server of the same name. `args` and `passEnvironment` from the file replace the bundled values.
- `defaults` merge one capability at a time, and the project file wins.

The client adds `output_directory` and `file_stem` after the fields of `input`, so a caller cannot replace them. The client also checks that each returned path is inside `outputDirectory`. A path outside it is `media-tool-invalid-result`.

## Bundled servers in milestone 1

| Folder               | Capabilities                        | Cost                           | Notes                                             |
| -------------------- | ----------------------------------- | ------------------------------ | ------------------------------------------------- |
| `tools/sample-media` | `image`, `speech`, `align`, `music` | Free, no network               | Made for tests and for work on yumekit. See below |
| `tools/openai-media` | `image`, `speech`, `align`          | The OpenAI API key of the user | Reads `OPENAI_API_KEY`                            |

### `tools/sample-media`

The sample server gives the same file for the same input, with no model.

- `generate_image` draws a PNG with a color from a hash of the prompt and the prompt as text.
- `generate_speech` writes a WAV file with a quiet tone. Its length is 0.3 seconds for each word. It returns word timings that divide the length evenly.
- `align_words` returns even word timings over the length of the audio file.
- `generate_music` writes a WAV file with a low tone of the requested length.

### `tools/openai-media`

OpenAI retires models often. The table gives the models that the documents supported on 2026-11-20. Each model name is one constant, and an environment variable can replace it. A user lists that variable in `passEnvironment`.

| Tool              | Endpoint                                                              | Default model         | Variable                      | Note                                       |
| ----------------- | --------------------------------------------------------------------- | --------------------- | ----------------------------- | ------------------------------------------ |
| `generate_image`  | `/v1/images/generations`, or `/v1/images/edits` with reference images | `gpt-image-2.5-flare` | `YUMEKIT_OPENAI_IMAGE_MODEL`  | No shutdown date                           |
| `generate_speech` | `/v1/audio/speech`                                                    | `gpt-4o-mini-tts`     | `YUMEKIT_OPENAI_SPEECH_MODEL` | OpenAI shuts this model down on 2027-01-06 |
| `align_words`     | `/v1/audio/transcriptions` with word timestamps                       | `whisper-1`           | `YUMEKIT_OPENAI_ALIGN_MODEL`  | OpenAI shuts this model down on 2027-02-26 |

- OpenAI names a Realtime model as the replacement for speech. It uses a different transport, so it needs its own design before 2027-01-06.
- No newer transcription model documents word timestamps. A local align server is the planned replacement.
- `generate_speech` asks for WAV output and reads the length from the file.
- `generate_speech` returns no `words`. The agent calls `align_words` after it.
- The server returns `cost_usd` only when the response gives an amount in dollars. It has no price table.
- The server checks the input before any request, so a call that cannot work costs nothing.
- With no key, each tool returns a failure that names `OPENAI_API_KEY` and `passEnvironment`.

### `tools/codex-images`

This server is not in milestone 1 yet. The Codex documents describe image generation only for an interactive session. They do not say that a `codex exec` run can make an image, or where the file goes. The lead agent runs one probe on the plan of the owner. If the probe gives an image in a known place, a later change adds the server with a test for that contract.

## Tests

1. The client tests start the sample server as a real child process and call each capability.
2. A fake server with a wrong result shape proves the failure `media-tool-invalid-result`.
3. A server command that does not exist proves `server-failed-to-start`, that `failedServers` names it, and that other servers still work.
4. A fake server that never answers, with `toolTimeoutSeconds` set to 1, proves `media-tool-timeout`.
5. A file that is not valid proves `invalid-configuration-file`.
6. A fake server that returns a path outside the output directory proves `media-tool-invalid-result`.
7. Tests of `openai-media` replace the network call at that outside boundary. They never spend money. They cover each tool, a missing key, an API error, and the conversion of word timestamps. One manual check with a real key goes in the pull request evidence.
