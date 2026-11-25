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
  "defaults": { "image": "openai", "speech": "openai", "align": "openai" },
  "limits": { "generatedVideoSeconds": 30, "spendingUsd": 5 }
}
```

- `passEnvironment` lists the names of environment variables that the server gets. The file never holds a secret value. Document 10 says where a key lives and how a server describes its models.
- The user file is in the configuration folder: `~/.config/yumekit`, or the folder in the environment variable `YUMEKIT_CONFIG_DIRECTORY` (document 10).
- `defaults` names the server for each capability when a tool call gives no server. An entry is a server name, or `{ "server": "...", "model": "..." }` (document 10).
- `limits` is optional. `generatedVideoSeconds` is the limit of document 09, a number of 0 or more, and 60 by default. `spendingUsd` is the spending limit of document 15 ("Details of WP64"), in US dollars, and 5 by default. `callsAtOnce` is a whole number of 1 or more that lowers the calls that run at the same time on each server (document 20, "Details of WP72"). The project file wins over the user file. `MediaTools.limits()` gives the merged value of the first two. `MediaTools.setLimits` writes `limits` of the project file (document 20, C42).
- The `yumekit` command passes the commands of the bundled servers as `bundledServers`. A file can use a bundled server by its name with no `command`.
- With no file (user or project), yumekit connects each bundled server, in the order `sample`, `openai`, `gemini`, `fal`, `local-voice`, `local-music`, `codex`. A bundled server with a missing key starts, and the editor shows that it needs a key.
- With a file, yumekit connects the servers of the file first. Then it connects each bundled server that the file does not name.
- An entry `"<name>": { "disabled": true }` turns off that server, also a bundled one.
- The order of the servers does not change how a call selects a server: the server of the call, then `defaults`, then the order with no pick of document 15. That order puts `sample` last.

## The convention

A server has a capability when it lists a tool with the name in this table. Wire names use `snake_case`. Time on the wire is in seconds, because a media server does not know the frame rate. The harness converts to frames.

| Capability     | Tool name               | Required input                                                  | Optional input                                                                                                |
| -------------- | ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `image`        | `generate_image`        | `prompt`, `output_directory`, `file_stem`                       | `width_pixels`, `height_pixels`, `reference_image_paths`, `transparent_background`                            |
| `speech`       | `generate_speech`       | `text`, `output_directory`, `file_stem`                         | `voice`, `instructions`, `speed`                                                                              |
| `align`        | `align_words`           | `audio_path`, `text`                                            | `language`                                                                                                    |
| `music`        | `generate_music`        | `prompt`, `duration_seconds`, `output_directory`, `file_stem`   |                                                                                                               |
| `video`        | `generate_video`        | `prompt`, `duration_seconds`, `output_directory`, `file_stem`   | `first_frame_path`, `last_frame_path`, `reference_image_paths`, `width_pixels`, `height_pixels`, `with_audio` |
| `sound-effect` | `generate_sound_effect` | `prompt`, `output_directory`, `file_stem`                       | `duration_seconds`                                                                                            |
| `talking-clip` | `generate_talking_clip` | `media_path`, `audio_path`, `output_directory`, `file_stem`     | `prompt`                                                                                                      |
| `sharper`      | `sharpen_media`         | `media_path`, `scale` (2 or 4), `output_directory`, `file_stem` |                                                                                                               |

Document 09 has the rules for a video server. Document 16 ("Details of WP47") has the rules for a sound effect server and a sharper server, and "Details of the talking clips" the rules for a talking clip server.

Each generate tool and `align_words` also accept the optional input `model` (document 10).

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
  cost_is_estimate?: boolean;
};
```

Rules for a server:

1. Write each file inside `output_directory` with a name that starts with `file_stem`. Return the absolute path.
2. Return a failure as a result with `isError: true` and a message that a person can act on, for example "OPENAI_API_KEY is not set". A failure because the plan of the person reached its usage limit also has `_meta: { "yumekit/failure": "usage-limit-reached" }`. A failure because the quota of the service for the model is used up (the code `RESOURCE_EXHAUSTED` of Gemini) has `_meta: { "yumekit/failure": "service-quota" }`, and its message gives the code and the message of the service, never a key or a header.
3. Never write outside `output_directory`.
4. `align_words` writes no file. It returns `files: []` and `words`.
5. A description can give `calls_at_once`: the most calls of the server that run at the same time. With none, the client runs 3. The Codex server gives 2.

The harness validates each result against the schema. A result that does not match is the failure `media-tool-invalid-result`, with the server name and the schema error.

## Client interface

```ts
type Capability =
  | "image"
  | "speech"
  | "align"
  | "music"
  | "video"
  | "sound-effect"
  | "talking-clip"
  | "sharper";

type MediaTools = {
  list: () => {
    server: string;
    capabilities: Capability[];
    description?: MediaServerDescription;
    descriptionFailure?: { kind: "media-tool-invalid-result"; message: string };
  }[];
  run: (request: {
    capability: Capability;
    server?: string;
    model?: string;
    input: JsonObject;
    outputDirectory: string;
    fileStem: string;
    onProgress?: (progress: {
      done: number;
      total?: number;
      message?: string;
    }) => void;
  }) => Promise<
    Outcome<
      { server: string; model?: string; result: MediaToolResult },
      MediaToolFailure
    >
  >;
  checkKey: (
    server: string,
  ) => Promise<Outcome<{ valid: boolean; message: string }, CheckKeyFailure>>;
  failedServers: () => { server: string; message: string }[];
  limits: () => { generatedVideoSeconds: number; spendingUsd: number };
  setLimits: (
    change: Partial<{ generatedVideoSeconds: number; spendingUsd: number }>,
  ) => Promise<Outcome<MediaLimits, UserFileFailure>>;
  checkKeys: () => Promise<void>;
  spending: () => Promise<Outcome<SpendingSummary, SpendingRecordNotValid>>;
  requests: () => Promise<Outcome<MediaRequestRecord[], RequestLogNotValid>>;
  recordRefusal: (refusal: {
    request: MediaToolRequest;
    failure: { kind: string; message: string };
  }) => Promise<void>;
  choices: () => Promise<MediaChoices>;
  pick: (pick: {
    capability: Exclude<Capability, "align">;
    server?: string;
    model?: string;
  }) => Promise<Outcome<MediaChoices, MediaPickFailure>>;
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

`MediaToolFailure` kinds: `no-server-for-capability`, `server-not-found`, `server-failed-to-start`, `media-tool-failed` (with the message of the server), `media-tool-invalid-result`, `media-tool-timeout`, `media-key-missing` (with `server`, `variable`, `getKeyUrl`, and `steps`, document 10), `media-key-not-working`, `media-service-not-ready` and `media-usage-limit-reached` (each with `server` and `message`, document 15, "Details of WP67"), `service-quota` (with `server` and `message`, document 20, "Details of WP72"), `spending-limit-reached`, and `spending-record-not-valid` (document 15, "Details of WP64").

`CheckKeyFailure` kinds: `server-not-found`, `server-failed-to-start`, `media-tool-failed`, `media-tool-invalid-result`, `media-tool-timeout`, and `no-check-key-tool` for a server that lists no `check_key`.

- At the start, the client calls `describe_media_server` of each server that lists it. `list` gives the description, or `descriptionFailure` when the result does not match the schema.
- `run` passes `model` to the tool. With no `model`, it uses the model of the `defaults` entry of the selected server. The result reports that model, or the default model of the description when neither names one.
- Before a call, `run` and `checkKey` start a server again when a value of its `passEnvironment` changed since it started. No other server stops.

A server that fails to start does not stop the others. `list` shows only the servers that started. `failedServers` gives the reason for each one that did not, and `yumekit mcp` prints those reasons.

A configuration file that is not valid is the failure `invalid-configuration-file`, with the file path and the schema error. `connectMediaTools` starts no server in that case.

`toolTimeoutSeconds` is the limit for one tool call. The default is 600. A call that passes the limit is the failure `media-tool-timeout`.

`run` returns the name of the server that it used, so a caller can record the source of an asset.

`run` records each call in `<project>/.yumekit/requests.json`, also a failed one, and `requests` gives the records, the newest first. A request can give `about: { shotId }` for the record. `recordRefusal` records a call that the caller refused before `run`, such as the video seconds limit of the harness. Document 20 ("Details of WP73") has the format.

How `run` selects a server:

1. It uses `server` from the request. If the request has none, it uses the server of the `defaults` entry for the capability.
2. If neither names a server, it uses the order with no pick of document 15: the first started server with the capability and each key that it needs, in the order `codex`, `openai`, `gemini`, `fal`, each other server in configuration order, `local-voice`, `local-music`, and `sample` last (documents 15, 18, and 19). A server with no key is ready when its `check_key` passes, and the client checks it before the call (document 15, "Details of WP67"). `align` with no `defaults` entry uses the server of the `speech` entry when that server has `align`.
3. A name that no file defines is `server-not-found`. A server that started without the tool is `no-server-for-capability`.

How the files merge:

- An entry with no `command` uses the bundled server of the same name. `args` and `passEnvironment` from the file replace the bundled values.
- `defaults` merge one capability at a time, and the project file wins.

The client adds `output_directory` and `file_stem` after the fields of `input`, so a caller cannot replace them. The client also checks that each returned path is inside `outputDirectory`. A path outside it is `media-tool-invalid-result`.

## Bundled servers in milestone 1

| Folder               | Capabilities                                                                            | Cost                                 | Notes                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/sample-media` | `image`, `speech`, `align`, `music`, `video`, `sound-effect`, `talking-clip`, `sharper` | Free, no network                     | Made for tests and for work on yumekit. See below                                                                                                                       |
| `tools/openai-media` | `image`, `speech`, `align`                                                              | The OpenAI API key of the user       | Reads `OPENAI_API_KEY`                                                                                                                                                  |
| `tools/gemini-media` | `image`, `speech`, `music`, `video`                                                     | The Gemini API key of the user       | Reads `GEMINI_API_KEY`. See documents 09 and 16. Not tested with a real key yet. Tests use recorded shapes from the documents.                                          |
| `tools/fal-media`    | `image`, `video`, `sound-effect`, `talking-clip`, `sharper`                             | The fal API key of the user          | Reads `FAL_KEY`. Document 10 has its endpoints, and document 16 its models. Not tested with a real key yet. Tests use recorded shapes from the documents of 2026-11-22. |
| `tools/local-voice`  | `speech`                                                                                | Free, on this computer               | One open voice model, Heart, that downloads once. Document 18 has the facts                                                                                             |
| `tools/local-music`  | `music`                                                                                 | Free, on this computer               | Music beds made from code, with no download. It offers only the styles that the owner approved. Document 19 has the facts                                               |
| `tools/codex-images` | `image`                                                                                 | The ChatGPT plan of the user, no key | Runs the Codex program of the user for one turn. Counts as 0 US dollars. Tested on 2026-11-24 with Codex CLI 0.163.0. See below                                         |

### `tools/sample-media`

The sample server gives the same file for the same input, with no model.

- `generate_image` draws a PNG with a color from a hash of the prompt and the prompt as text.
- `generate_speech` writes a WAV file with a quiet tone. Its length is 0.3 seconds for each word. It returns word timings that divide the length evenly.
- `align_words` returns even word timings over the length of the audio file.
- `generate_music` writes a WAV file with a low tone of the requested length.
- `generate_video` writes an MP4 file with FFmpeg, as document 09 says. It accepts a `duration_seconds` up to 60.
- `generate_sound_effect` writes a WAV file with a short high tone, 1 second long, or `duration_seconds` up to 30.
- `generate_talking_clip` writes an MP4 with FFmpeg: the picture, or the video in a loop, with the voice file as its sound, as long as the voice. The lips do not move.
- `sharpen_media` writes a real larger copy with FFmpeg: a PNG for a picture and an MP4 for a video, with the sound of the video. It adds no detail.

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
- The server returns `cost_usd` from the response when it gives an amount in dollars. If it gives none, the server can return an estimate from its model catalog, with `cost_is_estimate: true` (document 10).
- The server checks the input before any request, so a call that cannot work costs nothing.
- With no key, each tool returns a failure that names `OPENAI_API_KEY` and `passEnvironment`.

### `tools/codex-images`

The server makes a picture with the Codex program of the person and their ChatGPT plan. It needs no key. Document 15 ("Details of WP67") has the facts, the sources, and the real check.

- `generate_image` runs one short `codex exec` turn in a new temporary folder, takes the PNG that Codex wrote in `$CODEX_HOME/generated_images/<thread id>/`, checks it, and writes it to `output_directory`. Then it removes that folder and the temporary folder.
- Codex picks the exact size. `width_pixels` and `height_pixels` set only the shape: landscape, portrait, or square. A picture of another shape is a failure, and the server keeps no file.
- `reference_image_paths` takes up to 5 absolute paths. Codex gets them with `--image`.
- `check_key` is the free check of readiness: the program is there, `codex login status` says ChatGPT, and `codex features list` has `image_generation`. It makes no picture.
- The server finds the program in `YUMEKIT_CODEX_PATH`, or else as the first `codex` on the `PATH`. It reads `CODEX_HOME`, or else uses `~/.codex`.
- `YUMEKIT_CODEX_MODEL` and `YUMEKIT_CODEX_EFFORT` set the chat model (`-m`) and the reasoning effort (`-c model_reasoning_effort`) of the picture turn. They are optional and are not secrets. Document 20 ("Details of WP70") has the rules.
- A turn that reports the usage limit of the plan returns `isError` with `_meta: { "yumekit/failure": "usage-limit-reached" }`. The client gives the failure `media-usage-limit-reached`.

## Tests

1. The client tests start the sample server as a real child process and call each capability.
2. A fake server with a wrong result shape proves the failure `media-tool-invalid-result`.
3. A server command that does not exist proves `server-failed-to-start`, that `failedServers` names it, and that other servers still work.
4. A fake server that never answers, with `toolTimeoutSeconds` set to 1, proves `media-tool-timeout`.
5. A file that is not valid proves `invalid-configuration-file`.
6. A fake server that returns a path outside the output directory proves `media-tool-invalid-result`.
7. Tests of `openai-media` replace the network call at that outside boundary. They never spend money. They cover each tool, a missing key, an API error, and the conversion of word timestamps. One manual check with a real key goes in the pull request evidence.
