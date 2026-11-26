# 10 Providers, models, and keys

yumekit is a harness. It supports each provider that has a media server, and the person chooses the model and its settings for each asset. This document defines how a server describes its models, how a person selects one, and where an API key lives.

## Decisions

| Id  | Decision                                                                                     | Why                                                                                       |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| P1  | yumekit bundles a server for each provider that it supports, and no provider is the only one | The person chooses the model. A harness that supports one provider is not a harness       |
| P2  | A server describes its own models, their settings, and their prices                          | The editor and the agent show real choices with no list inside yumekit                    |
| P3  | A server describes the keys that it needs and how a person gets each one                     | The editor guides a person who has no key                                                 |
| P4  | A key lives in one user file outside each project, and an environment variable wins over it  | A person adds a key in the editor. A project folder and a shared file never hold a secret |
| P5  | A key never goes through an MCP tool or an agent                                             | A chat record and an agent provider must not see a secret                                 |

## The tool `describe_media_server`

A server can list the tool `describe_media_server`. It has no input. A server without it still works with `generate_asset`, and yumekit then shows only its name and its capabilities.

```ts
type MediaServerDescription = {
  label: string;
  runs: "hosted" | "on-this-computer";
  keys: MediaServerKey[];
  models: MediaModel[];
};

type MediaServerKey = {
  variable: string;
  label: string;
  get_key_url: string;
  steps: string[];
};

type MediaModel = {
  id: string;
  label: string;
  capability:
    | "image"
    | "speech"
    | "align"
    | "music"
    | "video"
    | "sound-effect"
    | "talking-clip"
    | "sharper";
  is_default: boolean;
  settings: MediaModelSetting[];
  prices: MediaModelPrice[];
  read_on: string;
  shutdown_on?: string;
  accepts?: (
    | "first_frame"
    | "last_frame"
    | "reference_images"
    | "image_input"
    | "video_input"
  )[];
  tested?: boolean;
  download?: { bytes: number; ready: boolean };
};

type MediaModelSetting =
  | {
      name: string;
      label: string;
      kind: "choice";
      choices: string[];
      default: string;
      choice_details?: {
        choice: string;
        label: string;
        line: string;
        approved: boolean;
      }[];
    }
  | {
      name: string;
      label: string;
      kind: "whole-number";
      minimum: number;
      maximum: number;
      default: number;
    }
  | { name: string; label: string; kind: "switch"; default: boolean }
  | { name: string; label: string; kind: "image-file" }
  | { name: string; label: string; kind: "image-files"; maximum: number };

type MediaModelPrice = {
  usd: number;
  unit: "second" | "image" | "minute" | "thousand-characters";
  when: { [settingName: string]: string };
};
```

Rules:

1. `name` of a setting is the name of an input field of the generate tool, for example `duration_seconds` or `resolution`. The editor builds its form from `settings` and sends the values as `input`.
2. Each generate tool of the server accepts the optional input `model`. Its value is the `id` of a model of that capability. With no `model`, the server uses the model with `is_default`. Exactly one model of each capability has `is_default`.
3. A server rejects a setting value that the model does not support, before any request. The message names the setting and the supported values.
4. `prices` is a list, because a price can depend on a setting. `when` gives the setting values that the price is for, for example `{ "resolution": "720p" }`. An empty `when` applies to each case. A free model has one price with `usd` 0.
5. `read_on` is the date when a person read the model facts and the prices in the documents of the provider. The editor shows a price as "about", with that date.
6. `steps` are short sentences that a person follows to get the key. `get_key_url` is the page where the person makes it.
7. `describe_media_server` works with no key, and makes no network request.
8. The harness validates the result against the schema. A result that does not match is `media-tool-invalid-result`, and the server stays usable without a description.
9. `accepts` and `tested` are optional, so an older description stays valid. Document 16 gives their meaning.
10. `download` is optional. A model that runs on this computer and needs one download gives its size in bytes and whether its files are there. Such a server has the tool `prepare_model`. Document 18, "Details of WP55", gives the rules.
11. `choice_details` is optional. It gives a name and one plain line for the person for each choice, and `approved: false` for a choice that waits for the approval of the owner. Document 19 ("Details of WP59") gives the rules.

A model catalog is a constant in the server package. The price rule of document 06 changes: a server can return `cost_usd` as an estimate from its catalog when the response of the provider gives no amount. The result then has `cost_is_estimate: true`.

### The catalog of `tools/openai-media`

Facts of 2026-11-21 from the OpenAI pricing page and the speech guide:

| Model                 | Settings in the catalog                                    | Price in the catalog                   |
| --------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `gpt-image-2.5-flare` | `transparent_background`, `reference_image_paths`          | None. The page gives token prices only |
| `gpt-4o-mini-tts`     | `voice`, one of the 13 built-in voices, `marin` by default | None. The page gives token prices only |
| `whisper-1`           | None                                                       | 0.006 US dollars for each minute       |

- Document 16 ("Details of WP46") adds more picture and voice models to this catalog, and the catalog of `tools/gemini-media`.
- A price in tokens does not fit `MediaModelPrice`, so the image and speech models have an empty `prices` list.
- `align_words` returns `cost_usd` from the `duration` of the response and the catalog price, with `cost_is_estimate: true`.
- When a `YUMEKIT_OPENAI_*_MODEL` variable names a model, that model is the default of its capability. A model that is not in the catalog gets an entry with no settings and no prices.

## Keys

### The key file

- The file is `~/.config/yumekit/keys.json`. It holds one object from variable name to value: `{ "GEMINI_API_KEY": "..." }`.
- The environment variable `YUMEKIT_CONFIG_DIRECTORY` replaces the folder `~/.config/yumekit`, for the key file and for the user `media-tools.json`. Tests set it to a temporary folder, so no test reads or writes the real files.
- A key file that yumekit cannot read, or that is not one object from names to text values, gives the state `missing` for each of its keys. `saveKey` and `removeKey` then return `key-file-not-writable` with the path and do not replace the file.
- yumekit creates the file with mode `0600` and its folder with mode `0700`. If the file has a wider mode, yumekit corrects it and continues. When yumekit writes the file, it also sets an existing folder to mode `0700`.
- yumekit never writes a key to a project folder, a log, a tool result, a failure message, or an asset source record.
- A later change can move the values to the keychain of the operating system. The interface below does not change.

### How a server gets a key

When yumekit starts a server, it gives each variable in `passEnvironment` of that server in this order:

1. The environment of the yumekit process.
2. The key file.

A variable that neither one has is not set. `passEnvironment` of a bundled server lists each `variable` of its `keys`, so a person never edits `media-tools.json` for a bundled server.

After a key changes, yumekit starts that server again. No other server stops. The client compares the values that a server got with the current values before each call to `run` and `checkKey`. A change starts that server again before the call, so a key that `yumekit keys set` saves reaches a running `yumekit mcp` at its next call.

### The key interface

`@yumekit/tools` owns the key file.

```ts
type KeyState = {
  variable: string;
  source: "environment" | "key-file" | "missing";
};

function readKeyStates(options: { variables: string[] }): Promise<KeyState[]>;
function saveKey(options: {
  variable: string;
  value: string;
}): Promise<Outcome<{ saved: true }, KeyFailure>>;
function removeKey(options: {
  variable: string;
}): Promise<Outcome<{ removed: boolean }, KeyFailure>>;
```

- No function returns a value of a key.
- `saveKey` rejects an empty value, a value with a line break, and a variable name that does not match `^[A-Z][A-Z0-9_]{1,63}$`. The failure kind is `key-not-valid`. A file that yumekit cannot write is `key-file-not-writable`, with the path.
- `saveKey` writes a temporary file in the same folder and renames it, so a crash leaves the old file.

### The command

| Command                          | What it does                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `yumekit keys`                   | Lists each server, each key it needs, the state of the key, and `get_key_url`             |
| `yumekit keys set <VARIABLE>`    | Reads the value from a prompt that does not show it, or from standard input, and saves it |
| `yumekit keys remove <VARIABLE>` | Removes the key from the key file                                                         |

The value is never a command argument, because a shell keeps arguments in its history.

### Keys and the agent

- No MCP tool reads, sets, or removes a key.
- `list_media_tools` returns the description of each server and the state of each key (`environment`, `key-file`, or `missing`), with `get_key_url` and `steps`, and `can_check_key` for each server (true when the server lists `check_key`). So an agent can tell the person what to do. It never returns a value.
- Before a call to a server with a missing key, the harness makes no tool call. It returns the failure `media-key-missing` with the server, the variable, `get_key_url`, `steps`, and the sentence "Add the key in the editor under Tools, or run `yumekit keys set <VARIABLE>`."

## What the editor shows

The editor is milestone 2. These rules are its input. The engine gives the editor the same data as `list_media_tools`, and three operations: save a key, remove a key, and test a server.

1. **Tools page.** One row for each server: its label, where it runs, what it makes, and its state (ready, needs a key, or failed to start with the reason).
2. **Key guide.** A server that needs a key shows `steps`, a button that opens `get_key_url`, and one field for the value. The field hides the value. After the save, the editor shows only that the key is set, and where it comes from.
3. **Test.** A button calls `describe_media_server` and one free request of the provider that proves the key, when the server has one. The tool for it is `check_key`. It has no input and returns `{ valid: boolean, message: string }`. A server without `check_key` shows no test button. The client call is `MediaTools.checkKey(server)` of document 06. `tools/openai-media` sends `GET /v1/models` with the key: status 200 is valid, 401 or 403 is not valid, and each other answer is a failure.
4. **Model picker.** Where a person makes or remakes an asset, the editor shows each model of that capability from each ready server, grouped by server. A model of a server that needs a key is visible and opens the key guide.
5. **Settings form.** The form comes from `settings` of the selected model. Next to the button, the editor shows the price for the selected values, from `prices`.
6. **Try again with another model.** An asset record keeps its server, model, and input. A person can select another model or other settings and make the asset again. The clips that use the asset keep their place.
7. **Defaults.** A person sets the default server and model for each capability. The editor writes it to `defaults` of `media-tools.json`. `defaults` accepts `"video": { "server": "fal", "model": "..." }` in addition to a server name.

## Bundled video servers

Document 09 named one video server. With decision P1, yumekit bundles three, and each one has its own work package. WP87 adds a fourth, `tools/sand-media`.

| Folder               | Runs             | Key              | Models at the start                                                                                   |
| -------------------- | ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `tools/gemini-media` | Hosted           | `GEMINI_API_KEY` | `gemini-omni-1.2-flash`                                                                               |
| `tools/fal-media`    | Hosted           | `FAL_KEY`        | 21 video (since WP87), 8 picture, 4 sound effect, 10 talking clip, and 9 sharper models (document 16) |
| `tools/sand-media`   | Hosted           | `SAND_API_KEY`   | `magi-2` of Sand AI (document 16, "Details of WP87")                                                  |
| `tools/local-video`  | On this computer | None             | Not built. LTX-2.3 is the first candidate                                                             |

### `tools/fal-media`

- fal hosts many video models behind one key. The server has one catalog entry for each fal endpoint that it supports. A catalog entry maps the convention inputs to the fields of that endpoint.
- The first entries are `bytedance/seedance-2.5/us/text-to-video` and `bytedance/seedance-2.5/us/image-to-video`. The server selects the image endpoint when the request has `first_frame_path`.
- Facts of 2026-11-21 from the fal model pages and their `llms.txt` pages: `duration` is a string from `"4"` to `"30"`, or `"auto"`. `resolution` is `480p`, `720p` (the default), `1080p`, or `4k`. `generate_audio` is true by default. `end_image_url` is the last frame, and only the image endpoint has it. The text endpoint takes `aspect_ratio` as `auto`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, or `9:16`. The image endpoint always uses `auto`, so the clip takes the shape of the first frame. Neither endpoint takes reference images.
- The price for one second is 0.2205 US dollars at 480p, 0.4730 at 720p, 1.164 at 1080p, and 1.840 at 4K. The price is the same with and without sound.
- The result has `video.url` and `seed`, and no size or length. The server reads the size and the length from the header of the MP4 file. If it cannot read them, it reports the requested length and no size.

How the server maps the convention inputs:

| Convention input                | fal field        | Rule                                                                                 |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `prompt`                        | `prompt`         | Unchanged                                                                            |
| `duration_seconds`              | `duration`       | A whole number from 4 to 30, sent as a string. Other values are rejected             |
| `resolution`                    | `resolution`     | One of the four values. `720p` by default                                            |
| `with_audio`                    | `generate_audio` | True by default                                                                      |
| `width_pixels`, `height_pixels` | `aspect_ratio`   | Text endpoint only. The nearest shape by the ratio of the sides. `16:9` with no size |
| `first_frame_path`              | `image_url`      | Uploaded first. Selects the image endpoint                                           |
| `last_frame_path`               | `end_image_url`  | Uploaded first. Needs `first_frame_path`                                             |
| `reference_image_paths`         | none             | Rejected                                                                             |

The server always sends `output_format: "mp4"`. It reads each image file before the first request, and rejects a file that is not PNG, JPEG, or WebP, or that is larger than 30 MB.

The endpoints that the server uses, from `fal.ai/docs/api-reference/inference-api` and its queue pages:

| Step           | Request                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | Header `Authorization: Key <FAL_KEY>` on each request to `queue.fal.run`, `rest.fal.ai`, and `api.fal.ai`                                                            |
| Upload, step 1 | `POST https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3` with `{ "file_name", "content_type" }`. The answer has `upload_url` and `file_url`        |
| Upload, step 2 | `PUT <upload_url>` with the bytes and `Content-Type`, and with no key. `file_url` is the value for the model                                                         |
| Submit         | `POST https://queue.fal.run/<endpoint id>` with the fields as JSON. The answer has `request_id`, `status_url`, and `response_url`                                    |
| Status         | `GET <status_url>`. Status 202 with `IN_QUEUE` or `IN_PROGRESS`, then 200 with `COMPLETED`. A failed request is also `COMPLETED`                                     |
| Result         | `GET <response_url>`. It returns the output, or the error of the model (for example 422 with a `detail` list)                                                        |
| Download       | `GET <video.url>` with no key                                                                                                                                        |
| `check_key`    | `GET https://api.fal.ai/v1/models/pricing?endpoint_id=<text endpoint id>`. It needs a key with any permission, and it runs no model. 401 or 403 means a rejected key |

- The upload flow is on the page `fal.ai/docs/documentation/model-apis/file-access-controls`. The fal CDN page says that a model takes a file as a URL.
- The server uses `status_url` and `response_url` from the answer, as the fal documents tell. It sends the key only to `queue.fal.run` and `queue.falrun.com`, and rejects another host.
- The server polls every 5 seconds, for at most 550 seconds in total (110 polls), so it stops before the default `toolTimeoutSeconds` of 600. The failure then gives the fal request id and says that fal can still finish and bill the request. It sends an MCP progress notification after each poll that is not complete, when the client asks for progress. A failure message names the fal request id.
- A failure message never holds the key. The server replaces the key value with `[FAL_KEY]` in each failure text.
- Document 16 (WP45) adds the other video models and the picture models. Each entry names its model pages as its sources, and a test checks each request body against the recorded schema of its page.

### `tools/local-video`

The probe ran on 2026-11-21, on a MacBook with an M3 Max and 64 GB of memory. It used LTX-2.3 distilled with `mlx-video`.

| Measure                             | Result                                                             |
| ----------------------------------- | ------------------------------------------------------------------ |
| Download                            | 73.5 GB in 96 minutes: 47.1 GB for LTX-2.3 and 26.4 GB for Gemma 3 |
| 5 second clip from text, 512 x 512  | 119 seconds                                                        |
| 5 second clip from a first frame    | 106 seconds, after a fix for a configuration defect in `mlx-video` |
| 5 second clip from text, 1280 x 704 | 351 seconds                                                        |
| Peak memory                         | 53 GB to 55 GB                                                     |
| License of the weights              | LTX-2 Community License                                            |

- Each time includes the load of the model into memory.
- The license is free below 10 million US dollars of revenue for each year. The user must disclose content that a machine made. The license does not permit a product that competes directly with the commercial products of the licensor.
- yumekit does not bundle the weights. The user downloads them, and the user accepts the license.

The owner decided on 2026-11-21: a local video server stays an option of the harness, with a low priority. LTX is one candidate, and another local model can replace it. The server follows the same convention as the hosted servers, so the choice of model stays inside the server. The design of the server has no document yet.

## Work packages

These add to the table in document 09. WP13 gets the catalog and `describe_media_server`.

| Id   | Scope                                                                                                                                                                                                                                                                               | Needs |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP15 | Keys and descriptions: the key file and its interface, `yumekit keys`, `describe_media_server` in the client, the sample server, and `tools/openai-media`, `list_media_tools` with descriptions and key states, `media-key-missing`, the `model` input, and `defaults` with a model | WP12  |
| WP16 | `tools/fal-media`                                                                                                                                                                                                                                                                   |       |
| WP17 | `tools/local-video`, with a low priority                                                                                                                                                                                                                                            | WP15  |

WP13 and WP16 follow WP15 for `describe_media_server` only. Each one can start before WP15 merges, with the types of this document.

### WP15 checks

1. `saveKey` then `readKeyStates` gives `key-file`. The file has mode `0600`. A file with mode `0644` is corrected.
2. An environment variable wins over the key file, and the state is `environment`.
3. `saveKey` rejects an empty value, a value with a line break, and a wrong variable name. A crash between the write and the rename leaves the old file (the test stops the rename at that outside boundary).
4. A fake server prints the environment that it gets. The test proves that a key from the key file reaches it, and that a variable that is not in `passEnvironment` does not.
5. No tool result, failure, log line, or asset record holds the test key value. One test searches each output of a full run for the value.
6. `yumekit keys` lists the state of each key and prints no value. `yumekit keys set` reads from standard input.
7. A call to a server with a missing key returns `media-key-missing` with the steps, and starts no tool call.
8. A description that does not match the schema leaves the server usable.
9. `generate_asset` with `model` passes it to the tool. An unknown `model` is rejected by the server with the list of ids.
10. The catalogs of the sample server and of `tools/openai-media` match their real tools: for each setting, a test sends the default value and gets no input failure.
11. `defaults` with a server name and with a server and model both work.

### WP16 checks

1. Tests replace the network call at that outside boundary. They never spend money.
2. Tests cover text to video, a first frame with an upload, a last frame, each rejected setting, a missing key, an API error, and a result that is not ready at the first poll.
3. The catalog matches the tool, as in WP15 check 10.
4. `check_key` returns `valid: false` with a clear message for a rejected key.
5. One manual check with a real key makes one 4 second clip at 480p. The pull request shows the `ffprobe` output and one frame.

## Not in this design

- The keychain of the operating system.
- Sign-in to a provider with a browser flow in place of a key.
- A model list that a server reads from the provider at run time.
- A spend record in dollars for each project (milestone 4).
- Servers for Replicate, BytePlus, Runway, and other hosts. Each one is a new folder in `tools/` that follows this document.
- A video call that takes longer than the tool time limit. A later change lets a caller read the result of a request that is still running.
