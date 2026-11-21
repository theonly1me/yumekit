# 11 The editor, milestone 2

The editor is the screen of yumekit. A person sees the video, changes scenes, picks a model, adds a key, and renders. This document defines the engine that serves the editor, the editor app, and the work packages of the first usable version.

The look comes from the approved prototype: dark by default, one typeface (Geist), thin lines, one accent, and the video as the only picture.

## Decisions

| Id  | Decision                                                                                  | Why                                                                                      |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| E1  | The editor is a web app that the engine serves on `127.0.0.1`. `yumekit open` starts it   | No Electron. A desktop shell with Tauri can wrap the same app later with no change to it |
| E2  | One engine process owns one project folder. A second process connects to it               | The store has no lock between processes. Two stores on one folder lose edits             |
| E3  | The editor changes a project only through the harness tools, the same ones an agent uses  | One set of rules and one undo history for a person and an agent                          |
| E4  | The preview is the stage page of the renderer in an `iframe`                              | A preview and a render show the same picture, as document 04 requires                    |
| E5  | Each request needs a session token, and the engine checks the `Host` and `Origin` headers | The engine can save a key and spend money. A web page in another tab must not reach it   |
| E6  | The editor learns of a change from an event, then reads the project again                 | An agent can change the project while the person looks at it                             |
| E7  | The agent panel is not in this document. The first version shows how to connect an agent  | The brain runner needs its own design (document 12)                                      |

## The engine

Package `@yumekit/engine` (Node). It may import `project`, `render`, `tools`, `harness-mcp`, and `scene-kit/schemas`. The dependency table of document 01 gets this row, and `apps/cli` may import `engine`.

```ts
function startEngine(options: {
  projectFolder: string;
  editorFolder?: string;
  port?: number;
}): Promise<Outcome<Engine, EngineFailure>>;

type Engine = {
  url: string;
  token: string;
  close: () => Promise<void>;
};

type EngineFailure =
  | { kind: "project-invalid"; message: string }
  | { kind: "engine-already-running"; url: string }
  | { kind: "port-not-free"; port: number };
```

- The engine listens only on `127.0.0.1`. With no `port`, it uses a free port.
- `url` holds the token: `http://127.0.0.1:<port>/?token=<token>`. The token is 32 random bytes as hex. A new start makes a new token.
- `editorFolder` is the folder of the built editor files. With none, the engine serves only the interface below.

### One engine for one project

1. At the start, the engine writes `<project>/.yumekit/engine.json` with `{ "port": number, "token": string, "processId": number }` and mode `0600`. It removes the file when it closes.
2. If the file exists and its engine answers `GET /api/health` with the token, `startEngine` returns `engine-already-running` with the URL.
3. If the file exists and no engine answers, the file is stale. The engine replaces it.
4. `yumekit mcp --project <folder>` reads the file first. If an engine runs, the command is a bridge: it serves MCP over stdio and sends each tool call to `POST /api/tools/<name>` of that engine. If no engine runs, the command works as in milestone 1.
5. `.yumekit/` is already in the `.gitignore` of a project.

### The harness as a function

`@yumekit/harness-mcp` gets a second public function, so the engine does not speak MCP to itself:

```ts
function createHarness(options: HarnessOptions): {
  tools: { name: string; description: string; inputSchema: JsonObject }[];
  call: (request: {
    name: string;
    input: JsonObject;
    onProgress?: (progress: {
      done: number;
      total?: number;
      message?: string;
    }) => void;
  }) => Promise<HarnessResult>;
  close: () => Promise<void>;
};

type HarnessResult = {
  isError: boolean;
  text: string;
  data: JsonObject;
  images: { mimeType: string; base64: string }[];
};
```

`createHarnessServer` becomes a thin MCP layer over `createHarness`. The tool list and each result stay the same.

### HTTP interface

Each request needs the header `Authorization: Bearer <token>`. A request without it gets status 401.

| Request                          | What it does                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                | Returns `{ "name": "yumekit", "projectFolder": string, "version": string }`                               |
| `GET /api/project`               | Returns the full snapshot: project, scenes with code, timelines, assets, and the revision                 |
| `POST /api/tools/<name>`         | Calls one harness tool. The body is `{ "input": object, "callId"?: string }`. Returns a `HarnessResult`   |
| `GET /api/assets/<assetId>/file` | Returns the media file of an asset, with range support for audio and video                                |
| `GET /api/media-servers`         | Returns the same data as `list_media_tools`: descriptions, key states, and the generated video seconds    |
| `PUT /api/keys/<VARIABLE>`       | Saves a key with `saveKey`. The body is `{ "value": string }`. Returns the new key state, never the value |
| `DELETE /api/keys/<VARIABLE>`    | Removes a key with `removeKey`                                                                            |
| `POST /api/keys/<server>/check`  | Calls `check_key` of that server. Returns `{ "valid": boolean, "message": string }`                       |
| `GET /api/preview`               | Returns `{ "pageUrl": string }` for the preview page of each output                                       |
| `GET /api/renders/<file>`        | Returns a file from `renders/`                                                                            |

- A tool that fails returns status 200 with `isError: true`, as over MCP. A tool name that does not exist returns status 404.
- After `PUT` or `DELETE` of a key, the engine starts that media server again, as document 10 says.
- The engine never writes a key value to a log or a response.
- A body that does not match its schema returns status 400 with the schema error.
- The tools `preview_frame` and `preview_frames` work over HTTP, but the editor does not use them. It uses the preview page.

### Events

`GET /api/events?token=<token>` is a WebSocket. The engine sends JSON messages:

```ts
type EngineEvent =
  | { type: "project-changed"; revision: number }
  | {
      type: "call-progress";
      callId: string;
      done: number;
      total?: number;
      message?: string;
    }
  | { type: "media-servers-changed" }
  | { type: "engine-closing" };
```

- `project-changed` comes from `subscribe` of the store, for a change by the person or by an agent.
- `call-progress` comes from `onProgress` of a tool call that gave a `callId`. A render reports frames. A media call reports the progress of its server.
- The editor sends nothing over the WebSocket.

### Requests from another site

1. The engine rejects a request whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, with status 403. This stops DNS rebinding.
2. The engine rejects a request with an `Origin` header that is not its own origin, with status 403. It sends no CORS headers.
3. The WebSocket has the same two checks and needs the token.
4. The preview page runs scene code that an agent wrote. It is served from a second port, so it has another origin and cannot read the token or call the interface.

## The preview

`@yumekit/render` gets one public function:

```ts
function startPreviewServer(options: {
  projectFolder: string;
}): Promise<Outcome<PreviewServer, RenderFailure>>;

type PreviewServer = {
  pageUrlOf: (outputId: string) => string;
  refresh: () => Promise<void>;
  close: () => Promise<void>;
};
```

- It is the stage server of document 04 with the stage in `preview` mode. It serves the scenes, the assets, and the frame pictures of document 09.
- The editor shows the page in an `iframe` and talks to it with `postMessage`:
  - To the page: `{ type: "seek", frame: number, requestId: number }`.
  - From the page: `{ type: "ready", frameCount: number }`, `{ type: "sought", requestId: number }`, and `{ type: "failed", requestId: number, kind: string, message: string, sceneId?: string }`.
- The page accepts a message only from the origin of the engine, which the URL of the page names. The editor accepts a message only from the origin of the preview page.
- The engine calls `refresh` after each `project-changed`. The page then loads the new project data and draws the current frame again.
- A scene that fails shows the failure in the editor next to the preview, with the scene id. The other scenes still draw.

#### Details of the preview page

1. `pageUrlOf(outputId)` returns `http://127.0.0.1:<port>/preview.html?output=<outputId>`. The engine adds `&parentOrigin=<engine origin>` before it gives the URL to the editor.
2. If `parentOrigin` is missing or is not an exact origin, such as `*`, the page accepts no message and sends no message.
3. The page accepts a message only when its origin is `parentOrigin` and its source is the parent window. It sends each message with `parentOrigin` as the target origin.
4. The page reads the project data from `GET /preview-data?output=<outputId>` of the preview server. It learns of a `refresh` from the event stream `GET /preview-events`.
5. The page sends `ready` after the first load and again after each `refresh`. After a `refresh`, it draws the frame of the last `seek` before it sends `ready`. If that draw fails, it first sends `failed` with the `requestId` of the last `seek`.
6. `failed` has the `kind` of a scene failure (`scene-error` or `kit-scene-not-found`), `frame-out-of-range`, or the kind of a load failure such as `output-not-found`.
7. The stage in `preview` mode has no render guards. For a scene that obeys document 02, the preview pixels equal the pixels of `renderFrame`. A test checks this for a kit scene, a custom scene, and a `video-clip` scene.

### Play

1. Play steps the frame from a clock in the editor: frame = start frame + elapsed seconds times the frame rate.
2. The editor asks for a frame only after the page answered the last one. So a slow scene drops frames and never queues them.
3. Sound in the preview: the editor plays each audio clip of the output with one `audio` element for each clip, started at the right offset with its gain. The sound of a video asset plays in the same way from the video file.
4. The preview sound is a guide. It can be late by a few frames. The render is exact.

## The editor app

Package `apps/editor` (browser): React, TypeScript, and Vite, built to static files. It imports no yumekit package at run time. It talks to the engine over HTTP.

- No component library. The styles are plain CSS with the tokens of the prototype in `apps/editor/src/styles/tokens.css`.
- Geist ships inside the app as a font file (SIL Open Font License), so the editor works with no network.
- The token comes from the URL at the first load. The app keeps it in memory, removes it from the address bar, and sends it with each request.
- The app holds one copy of the snapshot. After `project-changed`, it reads `GET /api/project` again. It keeps no second copy of project data that can go stale.
- Each change is one call to `POST /api/tools/<name>`. A failure shows its message and its hint next to the control that caused it.
- The app is usable with a keyboard: each control has a visible focus state, Space plays and pauses, the left and right arrows step one frame, and `Cmd+Z` and `Shift+Cmd+Z` call `undo` and `redo`.
- Dark is the default theme. Light is a setting that the app keeps in `localStorage`.

### Screens of the first version

| Screen         | What a person can do                                                                                                             | Tools it calls                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Editor         | See the preview, play, scrub, switch the output, and pick a scene from the scenes row                                            | none                            |
| Timeline       | See each track and clip, pick a clip, and move the playhead. Change of a clip by drag is milestone 3                             | none                            |
| Scene panel    | Change the props of a kit scene in a form made from its schema, read the code of a custom scene, and undo                        | `put_scene`, `undo`, `redo`     |
| Tools and keys | See each media server and its state, follow the key guide, save, test, and remove a key                                          | the key requests                |
| Make a clip    | Pick a model, set its settings from `settings`, see the price and the seconds used, make the clip, and place it                  | `generate_asset`, `place_video` |
| Render         | Pick outputs, start a render, see the progress, and open the file                                                                | `render_video`                  |
| Agent panel    | Read how to connect an agent: the command `yumekit mcp --project <folder>` and a ready configuration block for each known client | none                            |

- "Make a clip" needs a first frame. The person picks an image asset of the project, or makes a still first with `generate_asset` and the capability `image`.
- The price in "Make a clip" comes from `prices` of the model and the selected settings. With no matching price, the editor shows "Price not known".
- A model of a server with a missing key stays in the list. Its button opens the key guide of that server.
- The first run screen and the creation of a project in the editor are not in this version. `yumekit init` makes the project.

## The command

| Command                                             | What it does                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `yumekit open <folder> [--port <n>] [--no-browser]` | Starts the engine with the built editor, prints the URL, and opens it in the default browser |

- If an engine already runs for the folder, the command prints its URL, opens it, and exits.
- The command runs until the person stops it. It closes the engine and removes `engine.json`.

## Work packages

| Id   | Scope                                                                                                                                              | Needs      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| WP18 | `createHarness` in `@yumekit/harness-mcp`, with `createHarnessServer` as a layer over it                                                           | WP15       |
| WP19 | `startPreviewServer` and the preview page messages in `@yumekit/render`                                                                            |            |
| WP20 | `@yumekit/engine`: the server, the token and header checks, the interface, the events, `engine.json`, `yumekit open`, and the `yumekit mcp` bridge | WP18, WP19 |
| WP21 | `apps/editor` base: tokens, fonts, layout, the Editor screen with preview, play and sound, the scenes row, the Timeline, and the Agent panel       | WP20       |
| WP22 | The Scene panel, with the form from a kit scene schema, and undo                                                                                   | WP21       |
| WP23 | Tools and keys, and Make a clip                                                                                                                    | WP21       |
| WP24 | Render                                                                                                                                             | WP21       |

WP18 and WP19 start together. WP22, WP23, and WP24 start together after WP21.

### WP18 checks

1. Each harness tool gives the same result through `createHarness().call` and through the MCP server. One test runs the full tool list both ways.
2. `onProgress` reports the frames of `render_video`.
3. Each existing harness test passes with no change to what it checks.

### WP19 checks

1. The preview page draws the same pixels as `renderFrame` for the same frame, for a kit scene, a custom scene, and a `video-clip` scene.
2. A `seek` message gets one `sought` message with the same `requestId`.
3. After an edit and `refresh`, the page draws the new project at the same frame.
4. A scene that throws gives a `failed` message with the scene id, and the next `seek` still works.
5. The page ignores a message from another origin.

### WP20 checks

1. A request with no token, a wrong token, a wrong `Host`, or another `Origin` is rejected, for HTTP and for the WebSocket. Each case has a test.
2. `POST /api/tools/put_scene` changes the project, and the WebSocket sends `project-changed` with the new revision.
3. A second `startEngine` on the same folder returns `engine-already-running`. A stale `engine.json` is replaced.
4. `yumekit mcp` with a running engine sends its calls to that engine: an edit over MCP gives a `project-changed` event on the WebSocket of the engine.
5. A saved key reaches a fake media server, and no response, event, or log line holds the value.
6. `GET /api/assets/<assetId>/file` serves a range request.
7. The preview page cannot read the interface: a request from its origin is rejected.
8. The engine closes the preview server, the media servers, and the browser of the renderer when it closes. A test finds no child process after `close`.

### WP21 to WP24 checks

Each editor work package has browser tests that drive the real app against a real engine with the sample media server.

1. WP21: the preview shows the frame of the scrubber; play moves the frame and stops at the end; the output switch changes the shape; a click on a scene moves the playhead; an edit by another client (a tool call in the test) updates the screen with no reload; Space and the arrow keys work.
2. WP22: a change in the form of a kit scene changes the preview; a value that the schema rejects shows the failure next to its field; `Cmd+Z` restores the old value.
3. WP23: a server with no key shows its steps; a saved key changes the state to ready and the value is in no request to the page; "Make a clip" with the sample server makes a clip, places it, and shows it in the preview; a request past the limit shows the limit message; the price follows the settings.
4. WP24: a render shows progress and ends with a file that `ffprobe` can read.
5. Each work package shows screenshots of its screens in the pull request, in dark and in light. The lead compares them with the prototype.

## Not in this version

- The agent panel with a chat and approvals (document 12, the brain runner).
- The first run screen, and the creation or the choice of a project in the editor.
- Change of the timeline by drag, cut, and trim (milestone 3).
- An editor for custom scene code.
- A desktop shell with Tauri.
- An engine that serves more than one project, or that a person reaches from another machine.
