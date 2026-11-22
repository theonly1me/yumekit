# 11 The editor, milestone 2

The editor is the screen of yumekit. A person sees the video, changes scenes, picks a model, adds a key, and renders. This document defines the engine that serves the editor, the editor app, and the work packages of the first usable version.

The look comes from the approved prototype: dark by default, one typeface (Geist), thin lines, one accent, and the video as the only picture.

Document 13 replaces the screens of this document. The engine, the preview, and the agent setup stay.

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

1. At the start, the engine creates `<project>/.yumekit/engine.json` with `{ "port": number, "token": string, "processId": number }` and mode `0600`. The create is exclusive (the `wx` flag), so two starts at the same moment give one engine. The engine removes the file when it closes.
2. If the file exists and its engine answers `GET /api/health` with the token, `startEngine` returns `engine-already-running` with the URL.
3. If the file exists and no engine answers, the file is stale. The engine removes it and tries the exclusive create once more. If that create also fails, the engine that holds the file wins.
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

- `HarnessOptions` is `{ store: ProjectStore; mediaTools: MediaTools }`, the same options as `createHarnessServer`.
- `text` is the text blocks of the MCP result, joined with a line break. `data` is the structured content. `images` is the image blocks.
- `text` cannot give back the blocks. So both functions build one internal tool table, and the MCP layer keeps the blocks of each result.
- A call that the MCP SDK answers before the tool runs has a `kind` in `createHarness`: `invalid-input` for input that does not match the schema, and `tool-not-found` for a name that is not a tool.
- `close` refuses each new call with `harness-closed`, waits for the running calls, and closes the media tools.
- Each tool of `tools` also has `annotations` when the tool has them. Each `HarnessResult` also has `mcpResult`: the result that the MCP server gives for the same call, with its content blocks. For input that does not match the schema, `mcpResult` is the MCP SDK error result. The `yumekit mcp` bridge gives `mcpResult` to the agent, so an agent gets the same result with or without an engine.
- `onProgress` of a media call goes to `onProgress` of the request to `MediaTools.run` (document 06). `generate_asset` and `align_words` pass it on.
- Over MCP, the harness sends each progress as an MCP progress notification when the client gave a progress token.

### HTTP interface

Each request needs the header `Authorization: Bearer <token>`. A request without it gets status 401.

| Request                          | What it does                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                | Returns `{ "name": "yumekit", "projectFolder": string, "version": string }`                               |
| `GET /api/project`               | Returns the full snapshot: project, scenes with code, timelines, assets, and the revision                 |
| `GET /api/tools`                 | Returns `{ "tools": [...] }`: the `tools` list of `createHarness` with annotations, for the bridge        |
| `POST /api/tools/<name>`         | Calls one harness tool. The body is `{ "input": object, "callId"?: string }`. Returns a `HarnessResult`   |
| `GET /api/assets/<assetId>/file` | Returns the media file of an asset, with range support for audio and video                                |
| `GET /api/media-servers`         | Returns the same data as `list_media_tools`: descriptions, key states, and the generated video seconds    |
| `PUT /api/keys/<VARIABLE>`       | Saves a key with `saveKey`. The body is `{ "value": string }`. Returns the new key state, never the value |
| `DELETE /api/keys/<VARIABLE>`    | Removes a key with `removeKey`                                                                            |
| `POST /api/keys/<server>/check`  | Calls `check_key` of that server. Returns `{ "valid": boolean, "message": string }`                       |
| `GET /api/preview?output=<id>`   | Returns `{ "pageUrl": string }` for the preview page of the output. With no `output`, the first output    |
| `GET /api/renders/<file>`        | Returns a file from `renders/`                                                                            |

- A tool that fails returns status 200 with `isError: true`, as over MCP. A tool name that does not exist returns status 404.
- After `PUT` or `DELETE` of a key, the engine starts that media server again, as document 10 says.
- The engine never writes a key value to a log or a response.
- A body that does not match its schema returns status 400 with the schema error.
- The tools `preview_frame` and `preview_frames` work over HTTP. The preview of the editor uses the preview page. Only the stills of the scenes row use `preview_frames` (see "Details of the editor").

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
  | { type: "agents-changed"; connected: number }
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

### Details of the engine

These rules came from the build of WP20.

1. Each answer with a status other than 200 or 206 has the body `{ "kind": string, "message": string }`.
2. The statuses are 400 (a path or a body that is not valid), 401 (no token or a wrong token), 403 (`Host` or `Origin`), 404, 405 (a method that the path does not accept), 413 (a body larger than 10 MB), 426 (`/api/events` without a WebSocket), and 500 (a defect in the engine).
3. Only the header `Authorization: Bearer <token>` counts for HTTP. A token in the query of an HTTP request gets status 401. The engine compares the token in constant time.
4. The files of the built editor need no token, because a browser loads the first page from the URL with no header. They hold no project data. The `Host` and `Origin` checks still apply, and each editor file has `Content-Security-Policy: frame-ancestors 'none'`.
5. If `editorFolder` has no `index.html`, `GET /` returns a page that says the editor is not built.
6. A path segment of `.`, `..`, or a decoded segment with `/`, `\`, or a null byte gets status 400. The engine serves a file only when its real path is inside the folder.
7. Asset and render files have `Content-Security-Policy: default-src 'none'; sandbox`.
8. Each answer has `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.
9. `PUT /api/keys/<VARIABLE>` returns `{ "variable", "source" }`. `DELETE` returns `{ "removed", "variable", "source" }`. Both send `media-servers-changed`. The media server starts again before its next call, as document 10 says.
10. `POST /api/keys/<server>/check` returns status 404 for `server-not-found` and `no-check-key-tool`, and 502 for each other failure.
11. An invalid `media-tools.json` and a preview server that does not start give `project-invalid` with the message.
12. `findRunningEngine(projectFolder)` of `@yumekit/engine` reads `engine.json` and checks `GET /api/health`. `yumekit mcp` uses it.
13. `findBundledServers` is in `@yumekit/tools`, so the engine and `apps/cli` start the same bundled servers.
14. The bridge gets the instructions from `serverInstructions` of `@yumekit/harness-mcp`. It gives `mcpResult` of each call, and each tool with its annotations and `execution: { "taskSupport": "forbidden" }`, as the MCP SDK lists it. For a name that is not a tool, it gives the MCP SDK result `Tool <name> not found`. A test checks the full tool list and each result against `yumekit mcp` without an engine. Its frame previews, and those of the `createHarness` test, hold no downscaled video picture. Chromium on Linux drew the edge pixels of a 1280 by 720 video picture in an 80 by 45 frame in two ways from one browser launch to the next. The digits of the picture were the same. This is a render repeatability defect with no design yet: a frame picture at the render size would remove it.
15. `@yumekit/render` adds no signal listener. Its stage server runs Vite in middleware mode on its own `node:http` server, because Vite in server mode ends the process on `SIGTERM` and at the end of standard input. Its browser starts with `handleSIGINT`, `handleSIGTERM`, and `handleSIGHUP` set to `false`, because Playwright ends the process on `SIGINT`. So `yumekit open` closes the engine on `SIGTERM` and Ctrl+C, also while a render runs.
16. The preview page loads `/@vite/client`, because Vite imports it into each module with a dynamic `import()`. The client tries a WebSocket and logs a failure in the console. `server.ws: false` and `server.hmr: false` are set, and the Vite documents give no option that removes the client. The preview works.

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
7. The stage in `preview` mode has no render guards. For a scene that obeys document 02, the preview pixels equal the pixels of `renderFrame`. A test checks this for a kit scene, a custom scene, and a `video-clip` scene with a picture at the output size.
8. Chromium can draw a few edge pixels in another way in the preview. A 1280 by 720 video picture in a 640 by 360 output differed at its edges by up to 27 of 255. Text after earlier seeks differed by 1 of 255. The same frames in `render` mode inside the preview page differed in the same way, so the guards are not the cause. The preview is a guide, and the render is exact.

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
- The app reads an asset file with `GET /api/assets/<assetId>/file` and the `Authorization` header, and plays it from a blob URL. A media element cannot send the header, and the engine accepts the token only in the header.
- The app is usable with a keyboard: each control has a visible focus state, Space plays and pauses, the left and right arrows step one frame, and `Cmd+Z` and `Shift+Cmd+Z` call `undo` and `redo`.
- Dark is the default theme. Light is a setting that the app keeps in `localStorage`.

### Screens of the first version

| Screen         | What a person can do                                                                                                           | Tools it calls                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Editor         | See the preview, play, scrub, switch the output, and pick a scene from the scenes row                                          | none                            |
| Timeline       | See each track and clip, pick a clip, and move the playhead. Change of a clip by drag is milestone 3                           | none                            |
| Scene panel    | Change the props of a kit scene in a form made from its schema, read the code of a custom scene, and undo                      | `put_scene`, `undo`, `redo`     |
| Tools and keys | See each media server and its state, follow the key guide, save, test, and remove a key                                        | the key requests                |
| Make a clip    | Pick a model, set its settings from `settings`, see the price and the seconds used, make the clip, and place it                | `generate_asset`, `place_video` |
| Render         | Pick outputs, start a render, see the progress, and open the file                                                              | `render_video`                  |
| Agent panel    | Connect an agent with one button or one prompt, see that it is connected, and read the manual configuration. See "Agent setup" | the agent requests              |

- "Make a clip" needs a first frame. The person picks an image asset of the project, or makes a still first with `generate_asset` and the capability `image`.
- The price in "Make a clip" comes from `prices` of the model and the selected settings. With no matching price, the editor shows "Price not known".
- A model of a server with a missing key stays in the list. Its button opens the key guide of that server.
- The first run screen and the creation of a project in the editor are not in this version. `yumekit init` makes the project.

#### Details of the editor

These rules came from the build of WP21.

1. The scenes row shows one still for each clip of the first scene track that is not a caption track, in start order. A caption track is a scene track whose clips all show `caption-words` scenes, as in `place_narration`.
2. Each still comes from one call of `preview_frames` for up to 8 clips, so the stills of a project cost one renderer page and no extra preview page. The frame is 75% into the clip, where kit motion has settled. The scale is the smallest of 0.25, 0.5, and 1 that gives a still 380 pixels wide or more. The editor reads the stills again after each `project-changed`.
3. A still is the full frame of the output, so it also shows the captions of that frame.
4. The output switch shows the label of each output with a capital first letter. `yumekit init` sets the label to the id.
5. A clip picked in the scenes row or the timeline stays selected while the playhead is inside it. Otherwise the selection follows the clip of the first scene track at the playhead. A pick in the scenes row also opens the Scene tab.
6. The timeline names each track by its id, with a capital first letter and spaces for hyphens. An audio clip shows the `text` or the `prompt` of its tool input, or its asset id. An audio clip of an asset with word timings and a clip of a caption track use the narration style.
7. The Agent tab follows "Agent setup". Its manual part shows the MCP command and a block for Claude Code, Codex, and Cursor.
8. The Render button opens the Render sheet. See "Details of Render".
9. The theme setting is a text button in the top bar. The key in `localStorage` is `yumekit-theme`.
10. A reload loses the token, because the app keeps it only in memory. The page then asks for the link from `yumekit open`.
11. The editor browser tests start `yumekit open` as a child process and use only HTTP, so `apps/editor` imports no yumekit package. The test setup builds the editor first, because CI runs `pnpm test` before `pnpm build`.

#### Details of the Scene panel

These rules came from the build of WP22.

1. The form of a kit scene comes from the JSON Schema of its props in `list_kit_scenes`. A string is a text field. A string that allows more than 200 characters, or has no limit, is a text area. A number is a field that takes only digits, one minus sign at the start, and one decimal point. An `integer` takes whole numbers only. An empty number field removes an optional prop. An `enum` is a choice. A `boolean` is a switch. An array of strings is a list of text, and an array of objects is a list of objects. An object is a group of fields.
2. Each kit prop that holds an asset id has `assetKind` (`image`, `video`, or `audio`) in its schema. `@yumekit/scene-kit` sets it with `meta`, and `z.toJSONSchema` copies it. The form shows it as a choice of the project assets of that kind.
3. The `invalid-props` failure of `put_scene` has `issues`: a list of `{ path, message }`, with the path of each prop that the schema rejected. The form shows each message under the field with the longest matching path. A message with no matching field shows under the form. The form words each issue in plain words from the kit schema and the value that it sent: "Give at least 1 character", "Use at most 60 characters", "Use a number from 0 to 1", "Use a whole number", "Fill in this field", "Choose one of left, right", "Add at least 1 item", and "Use at most 6 items". For an issue that it cannot word, it shows the tool message, unless that message has the words of the schema library ("zod", "expected", or "received"). Then it shows "This value does not fit this field."
4. The form calls `put_scene` 450 ms after the last key in a text field, at once for a choice, a switch, and a list button, and when a field loses focus. A new list item waits for its first change. An empty optional field removes its prop.
5. After each `project-changed`, the form shows the stored props, unless a change of the person waits or runs. The form also skips a snapshot whose revision is not newer than the revision of its own last saved change, because that snapshot can arrive after a later change of the person. A rejected value stays in its field until the stored props change.
6. The editor sends `put_scene`, `undo`, and `redo` one after another, in the order of the actions of the person.
7. `Cmd+Z` and `Ctrl+Z` call `undo`. `Shift+Cmd+Z` and `Shift+Ctrl+Z` call `redo`. A text field that the person typed in since it got focus keeps these keys for its own undo. The undo and redo buttons of the Scene tab always call the tools, and a failure such as "nothing to undo" shows under them.
8. A custom scene shows its code read only, with a line that says that the agent changes it.
9. The project data has no link between a scene and its narration, so the Scene tab has no narration group.
10. Each column of the scenes row is as wide as its still: 152 pixels for a wide output, 112 for a square one, and 88 for a tall one. Under a square or tall still, the length is on a second line under the title.

#### Details of Tools and Make a clip

These rules came from the build of WP23.

1. A Tools row shows the label, what the server makes, where it runs, and one state: "Ready, no key needed", "Ready, key saved here", "Ready, key from your shell", "Needs a key", or "Failed to start". A row opens its detail. The detail of a failed server shows the reason.
2. The key field is a password field with `autocomplete="off"`. The editor reads its value only in the save handler, and clears the field right after it sends `PUT /api/keys/<VARIABLE>`. The value is never in React state.
3. The link to `get_key_url` is an `a` element with `target="_blank"` and `rel="noopener noreferrer"`. Its text names the host, for example "Open fal.ai".
4. Each server of `GET /api/media-servers` and `list_media_tools` has `can_check_key`: true when the server lists the tool `check_key`. The editor shows "Test the key" only for a server with `can_check_key` and a saved key or a key from the shell.
5. With no `media-tools.json`, yumekit connects each bundled server (document 06). So a new project shows Sample, OpenAI, Google Gemini, and fal in Tools, and a person adds a key there. The "Add another tool" text tells the person to put another MCP server in `media-tools.json`.
6. "Make a clip for this scene" is in the Scene tab for each scene clip. The sheet makes the clip for the selected scene clip of the current output.
7. The sheet calls `place_video` with `replace_clip_id` set to the selected scene clip. The video takes the start frame and the length of that clip, in one edit batch. One undo brings back the scene clip.
8. The length setting (`duration_seconds`) starts at the length of the scene clip in whole seconds, inside the range of the model. A video request sends `width_pixels` and `height_pixels` of the current output. A still request sends them only when the image model lists both settings.
9. The first frame is the newest image asset of the project, or one that the person picks. With no image asset, the sheet shows the still form. The still uses the first ready image model. The person can pick another one when more than one is ready.
10. The settings form shows `choice` as buttons, `whole-number` as a slider for a range of 120 steps or fewer and as a number field for a larger range, and `switch` as a check box. `image-files` with the name `reference_image_paths` is a list of the image assets, sent as `reference_asset_ids`. The harness has no asset id field for another `image-file` setting, such as `last_frame_path`, so the form leaves it out.
11. The price uses the price whose `when` matches the most selected values. The editor multiplies the unit `second` by `duration_seconds`, and the unit `minute` by `duration_seconds` divided by 60. With no match, the sheet shows "Price not known". With a price that is not free, the sheet shows the `read_on` date.
12. The sheet reads `generated_video` when it opens, after `media-servers-changed`, after each connect of the event WebSocket, and after each make. If the selected length plus the used seconds is more than the limit, the sheet shows the limit message and no button to make the clip. The failure `generated-video-limit-reached` from the engine shows the same message with the numbers of the failure.
13. The app has one event WebSocket, in the project hook. The hook sends each event, and `connection-opened` after each connect, to the listeners on the engine client. After each connect, the project hook and the media server list read their data again. The sheet sends a `callId` with `generate_asset` and shows the message of each `call-progress` for that call.
14. The browser tests run the engine with a temporary `HOME`, and with `PLAYWRIGHT_BROWSERS_PATH` set to an empty folder. So the engine finds no Chromium, and `preview_frames` fails with `browser-not-installed`. Stills after each change cost about 6 times the CPU time of the editor tests, and on a CI runner with 4 processors two test setups ran past 120 seconds. A test that needs the renderer, such as the test of the scenes row stills, starts the engine with `withChromium`. Then the engine gets the Chromium folder of the test process.

#### Details of Render

These rules came from the build of WP24.

1. The sheet lists each output with its label, its size, and its length. An output with no clips cannot be chosen. At first each output with clips is chosen. After a render, the sheet keeps the outputs of the last render.
2. "Render N files" runs one `render_video` call for each chosen output, one after another, at the full size of the output. Each call has a `callId`. While renders run, the sheet listens on the events of the engine client and shows each `call-progress` as frames done of the total, with a thin progress line.
3. The renders belong to the editor shell, not to the sheet. A render keeps running when the person closes the sheet, the Render button shows "Rendering N%" over all chosen files, and the sheet shows the progress again when it opens. A reload of the page loses this state, and the engine still finishes the render.
4. A finished render shows the full path of the file with a button that copies it, and "Open the video". That button opens a new tab first, so the browser does not block it, then fetches `GET /api/renders/<file>` with the header and shows the file from a blob URL. If `Content-Length` is more than 512 MB, the editor does not load the file and asks the person to copy the path.
5. A failed render shows the message of the tool. The hint of the tool is for an agent, so the sheet does not show it. A render failure about a scene has `scene_id` and `frame` in its data. Then the sheet says "Ask your agent to correct the scene <title>, or change it in the Scene panel." and shows "Open this scene". That button closes the sheet, picks the clip of the scene in that output, moves the playhead to the failed frame, and opens the Scene tab.
6. The render tests start the engine with `withChromium`, because a render needs the renderer.

### Agent setup

The owner asked for this on 2026-11-21. The person must not copy a configuration block by hand. yumekit connects the agent, and the manual blocks stay as a second choice.

| Decision | What                                                                                       | Why                                                                         |
| -------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| A1       | One module connects an agent. The engine and the command both call it                      | One set of rules for the button and for the prompt                          |
| A2       | The configuration runs the command with full paths: the Node program and the CLI script    | `yumekit` is not always on the `PATH`, and an agent in a window has another |
| A3       | The module prefers a file in the project folder to a file in the home folder               | The person can see the change and remove it with the project                |
| A4       | The module merges into a file that exists. It changes only the entry with the name yumekit | Other servers of the person stay as they are                                |
| A5       | The module never starts an agent, and it calls no model                                    | The brain runner is document 12                                             |
| A6       | The engine tells the editor when an agent is connected                                     | The person sees that the setup worked                                       |

#### The module

- `listAgents({ projectFolder })` gives one record for each known agent: `id`, `name`, `installed`, `configured`, `start_command`, and `configuration_file`.
- `connectAgent({ agentId, projectFolder, serverCommand })` writes the configuration and gives the same record. It gives a failure as a value, with a sentence for a person.
- `installed` is true when the program of the agent is on the `PATH` of the engine. `configured` is true when the configuration has a yumekit entry for this project folder.
- The known agents are `claude-code`, `codex`, and `cursor`. The id comes from this fixed list only.
- `serverCommand` is `{ command, args }`. The command `yumekit open` makes it from `process.execPath` and the path of its own script, then `mcp --project <folder>`.

Where each agent keeps the entry:

| Agent       | File                           | Start in the project folder | Source                                                                                                                         | Checked with                      |
| ----------- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Claude Code | `<project>/.mcp.json`          | `claude`                    | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)                                                             | Claude Code 2.1.330               |
| Cursor      | `<project>/.cursor/mcp.json`   | `cursor-agent`              | [cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp), [cursor.com/docs/cli/mcp](https://cursor.com/docs/cli/mcp) | `cursor-agent` 2026.09.02-c22c1a3 |
| Codex       | `<project>/.codex/config.toml` | `codex`                     | [developers.openai.com/codex/mcp](https://developers.openai.com/codex/mcp)                                                     | `codex-cli` 0.163.0               |

- The builder confirms each row with the documents of the agent and with the installed program, and records the source and the version here.
- For Codex, a configuration file in the project folder is the first choice. If the installed Codex does not read one, the module runs the `codex mcp add` command of Codex. It does not write `~/.codex/config.toml` itself.
- If a file exists and the module cannot read it as its format, the module changes nothing and gives a failure.
- The files hold full paths of one computer. `yumekit init` puts them in the `.gitignore` of a new project.

#### The engine and the command

| Request                         | Result                                                  |
| ------------------------------- | ------------------------------------------------------- |
| `GET /api/agents`               | `{ agents, connected }`. `connected` is a count         |
| `POST /api/agents/<id>/connect` | The record of the agent after the write, or the failure |

- Each request needs the session token, as the other requests do.
- `startEngine` takes `serverCommand` as an option. With no option, the two requests give a failure that says to use `yumekit open`.
- The `yumekit mcp` bridge tells the engine that it is an agent connection. The engine counts the bridges that are open, and sends the event `agents-changed` when the count changes.
- The command `yumekit agent connect --agent <id> [--project <folder>]` calls the same module. It prints the file that it changed and the next step for the person. It works with and without a running engine.

#### The Agent tab

1. The tab starts with one line of state: "No agent is connected yet." or "An agent is connected."
2. Then it shows one row for each agent, with its name and "Found on this computer" or "Not found on this computer". An agent that is found comes first.
3. Each row has the button "Connect". After a connect, the row says where the entry is, and shows the start line `cd <folder> && <start command>` with "Copy".
4. For Claude Code, the row also says that Claude Code asks once to approve the server.
5. Below the rows is "Or give this to an agent that already runs", with the prompt and "Copy the prompt".
6. The manual command and the configuration blocks are below, closed, under "Set up by hand". They use the same full paths as the module.

The prompt, with the real command and folder in it:

```
Connect yourself to my yumekit project.
1. Run this command. Use your own name for <agent>: claude-code, codex, or cursor.
   <command> agent connect --agent <agent> --project <folder>
2. Tell me how to reload your MCP servers, or reload them if you can.
3. Then call the yumekit tool get_project and tell me what the project holds.
```

#### Details of agent setup

These rules came from the build of WP25.

1. The module is in `@yumekit/engine` (`packages/engine/src/agents`). The import table permits `engine` for `apps/cli`, so `yumekit agent connect` and the engine call the same functions.
2. Claude Code and Cursor read `{ "mcpServers": { "yumekit": { "type": "stdio", "command", "args" } } }`. The module keeps each other key of the file and writes the JSON with 2 spaces and a final newline.
3. Codex 0.163.0 reads `<project>/.codex/config.toml`, but only in a trusted folder. A check with a temporary `CODEX_HOME` showed this: `codex mcp list` in the project folder listed no server, and listed yumekit after `[projects."<folder>"] trust_level = "trusted"` was in the home file. So the module writes the project file and never runs `codex mcp add`. The entry name is `yumekit` in each project file, so two projects do not collide. The row and the command say that Codex asks once to trust the folder. That Codex asks when it starts in an untrusted folder is an inference from its documents. No check started a Codex session.
4. The TOML entry is the table `[mcp_servers.yumekit]`. The module parses the file with `smol-toml` 1.9.1 (BSD-3-Clause), removes the old `[mcp_servers.yumekit]` table and its sub-tables as text, and adds the new table at the end. It keeps the other text of the file, with its comments. It parses the result again. If the other values changed, or the entry is not the new one (for example an inline `mcp_servers.yumekit = { ... }`), it changes nothing and gives a failure.
5. A connect writes only when the new text differs from the old text, with a temporary file and a rename. So a second connect leaves the file and its time as they were.
6. `configured` is true when the entry has `--project` followed by this project folder in its `args`. A file that is not valid gives `configured: false` in the list, and the failure only on a connect.
7. Cursor also asks to approve a project server: `cursor-agent mcp list` showed "not loaded (needs approval)". So each row shows one note: Claude Code and Cursor ask once to approve the server, and Codex asks once to trust the folder.
8. `installed` looks for `claude`, `codex`, and `cursor-agent` as programs in the folders of `PATH` of the engine.
9. The failures are `configuration-not-readable`, `configuration-not-valid`, and `configuration-not-written`, each with the file and a sentence. Over HTTP, `configuration-not-valid` has status 409 and the other two have 500. An id that is not in the list has status 404 with `agent-not-found`. With no `serverCommand`, both requests have status 409 with `no-server-command` and a message that names `yumekit open`.
10. `GET /api/agents` returns `{ agents, connected, serverCommand }`. The editor uses `serverCommand` for the manual blocks and for the prompt, so the editor shows the full paths of the engine.
11. The prompt needs the command that runs yumekit. The editor takes `serverCommand` without its last three words, `mcp --project <folder>`. `yumekit open` always makes `serverCommand` in this form.
12. `yumekit open` makes `serverCommand` from `process.execPath`, the real path of its `main.js`, and the real path of the project folder, because the engine compares the entry with the real path. The store keeps the folder as the person gave it, as before.
13. The bridge count: the `yumekit mcp` bridge opens the event WebSocket with `client=agent` in the query. The engine counts each open WebSocket with that query, and sends `{ "type": "agents-changed", "connected": number }` when one opens or closes. The editor never sends `client`, so its own connection does not count. The event holds the count, so the editor reads nothing again.
14. The state line says "No agent is connected yet." for 0, "An agent is connected." for 1, and "N agents are connected." for more.
15. A row that is already configured shows the entry and the start line also before a new connect. "Connect" is a primary button for a found agent with no entry.
16. `yumekit init` puts `.mcp.json`, `.codex/config.toml`, and `.cursor/mcp.json` in the `.gitignore`. It does not ignore all of `.cursor/` or `.codex/`, because a person can keep other files there.
17. A cheap real check ran each list command under `sandbox-exec` with a profile that permits writes only in a temporary folder, and with a temporary `HOME`, `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `XDG_CONFIG_HOME`, and `TMPDIR`. After `yumekit agent connect` for each agent: `claude mcp list` showed yumekit as "Pending approval", `codex mcp list` showed yumekit as enabled in a trusted folder, and `cursor-agent mcp list` showed "needs approval". After `cursor-agent mcp enable yumekit`, `cursor-agent mcp list-tools yumekit` listed 30 tools. No check started a model.

#### WP25 checks

1. A connect for each agent, in a temporary project and a temporary home folder, gives a file that the agent format accepts. A second connect changes nothing.
2. A connect keeps another server in a file that exists. A file that is not valid stays unchanged, and the tab shows the failure.
3. The entry runs the full paths, and a process started from that entry answers `tools/list`.
4. The count `connected` goes up when a bridge opens and down when it closes, and the tab follows without a reload.
5. A cheap real check: after a connect in a temporary project, the list command of each installed agent shows yumekit. No check starts a model.
6. Screenshots of the tab in dark and in light: before a connect, after a connect, with an agent connected, and with "Set up by hand" open.

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
| WP25 | Agent setup: the module, the two agent requests, the count of bridges, `yumekit agent connect`, and the Agent tab                                  | WP21       |

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
- A way to play a large asset file without loading all of it.
- A desktop shell with Tauri.
- An engine that serves more than one project, or that a person reaches from another machine.
