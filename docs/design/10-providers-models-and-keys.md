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
  capability: "image" | "speech" | "align" | "music" | "video";
  is_default: boolean;
  settings: MediaModelSetting[];
  prices: MediaModelPrice[];
  read_on: string;
  shutdown_on?: string;
};

type MediaModelSetting =
  | {
      name: string;
      label: string;
      kind: "choice";
      choices: string[];
      default: string;
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

A model catalog is a constant in the server package. The price rule of document 06 changes: a server can return `cost_usd` as an estimate from its catalog when the response of the provider gives no amount. The result then has `cost_is_estimate: true`.

## Keys

### The key file

- The file is `~/.config/yumekit/keys.json`. It holds one object from variable name to value: `{ "GEMINI_API_KEY": "..." }`.
- yumekit creates the file with mode `0600` and its folder with mode `0700`. If the file has a wider mode, yumekit corrects it and continues.
- yumekit never writes a key to a project folder, a log, a tool result, a failure message, or an asset source record.
- A later change can move the values to the keychain of the operating system. The interface below does not change.

### How a server gets a key

When yumekit starts a server, it gives each variable in `passEnvironment` of that server in this order:

1. The environment of the yumekit process.
2. The key file.

A variable that neither one has is not set. `passEnvironment` of a bundled server lists each `variable` of its `keys`, so a person never edits `media-tools.json` for a bundled server.

After a key changes, yumekit starts that server again. No other server stops.

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
- `list_media_tools` returns the description of each server and the state of each key (`environment`, `key-file`, or `missing`), with `get_key_url` and `steps`. So an agent can tell the person what to do. It never returns a value.
- Before a call to a server with a missing key, the harness makes no tool call. It returns the failure `media-key-missing` with the server, the variable, `get_key_url`, `steps`, and the sentence "Add the key in the editor under Tools, or run `yumekit keys set <VARIABLE>`."

## What the editor shows

The editor is milestone 2. These rules are its input. The engine gives the editor the same data as `list_media_tools`, and three operations: save a key, remove a key, and test a server.

1. **Tools page.** One row for each server: its label, where it runs, what it makes, and its state (ready, needs a key, or failed to start with the reason).
2. **Key guide.** A server that needs a key shows `steps`, a button that opens `get_key_url`, and one field for the value. The field hides the value. After the save, the editor shows only that the key is set, and where it comes from.
3. **Test.** A button calls `describe_media_server` and one free request of the provider that proves the key, when the server has one. The tool for it is `check_key`. It has no input and returns `{ valid: boolean, message: string }`. A server without `check_key` shows no test button.
4. **Model picker.** Where a person makes or remakes an asset, the editor shows each model of that capability from each ready server, grouped by server. A model of a server that needs a key is visible and opens the key guide.
5. **Settings form.** The form comes from `settings` of the selected model. Next to the button, the editor shows the price for the selected values, from `prices`.
6. **Try again with another model.** An asset record keeps its server, model, and input. A person can select another model or other settings and make the asset again. The clips that use the asset keep their place.
7. **Defaults.** A person sets the default server and model for each capability. The editor writes it to `defaults` of `media-tools.json`. `defaults` accepts `"video": { "server": "fal", "model": "..." }` in addition to a server name.

## Bundled video servers

Document 09 named one video server. With decision P1, yumekit bundles three, and each one has its own work package.

| Folder               | Runs             | Key              | Models at the start                           |
| -------------------- | ---------------- | ---------------- | --------------------------------------------- |
| `tools/gemini-media` | Hosted           | `GEMINI_API_KEY` | `gemini-omni-1.2-flash`                       |
| `tools/fal-media`    | Hosted           | `FAL_KEY`        | Seedance 2.5 text to video and image to video |
| `tools/local-video`  | On this computer | None             | LTX-2, after the probe below gives its facts  |

### `tools/fal-media`

- fal hosts many video models behind one key. The server has one catalog entry for each fal endpoint that it supports. A catalog entry maps the convention inputs to the fields of that endpoint.
- The first entries are `bytedance/seedance-2.5/us/text-to-video` and `bytedance/seedance-2.5/us/image-to-video`. The server selects the image endpoint when the request has `first_frame_path`.
- Facts of 2026-11-21 from the fal model page: `duration` is 4 to 30 seconds, `resolution` is `480p`, `720p`, `1080p`, or `4k`, `generate_audio` is true by default, and `end_image_url` is the last frame. The price for one second is about 0.22 US dollars at 480p, 0.47 at 720p, 1.16 at 1080p, and 1.84 at 4K.
- The server uploads a local image with the upload interface of fal, because the endpoint takes an image URL.
- The builder reads the fal documents for the queue interface and the upload interface, and writes the endpoints into this section in the same pull request.
- A later change adds a catalog entry for each other fal video model. Each entry needs the model page as its source and a test.

### `tools/local-video`

A probe on the computer of the owner comes first. It measures LTX-2 with `mlx-video`: the size of the download, the peak memory, the time for a 5 second clip from a first frame, and the license of the weights. The design of the server follows the probe. A license that does not permit bundled use stops the work, and the owner decides.

## Work packages

These add to the table in document 09. WP13 gets the catalog and `describe_media_server`.

| Id   | Scope                                                                                                                                                                                                                                                                               | Needs |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP15 | Keys and descriptions: the key file and its interface, `yumekit keys`, `describe_media_server` in the client, the sample server, and `tools/openai-media`, `list_media_tools` with descriptions and key states, `media-key-missing`, the `model` input, and `defaults` with a model | WP12  |
| WP16 | `tools/fal-media`                                                                                                                                                                                                                                                                   |       |
| WP17 | `tools/local-video`, after the probe                                                                                                                                                                                                                                                | WP15  |

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
