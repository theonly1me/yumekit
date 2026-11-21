# @yumekit/engine

The engine process: one engine for one project, with the HTTP and WebSocket interface that the editor uses. Design: [11-editor-m2.md](../../docs/design/11-editor-m2.md).

## What this package owns

- The listener on `127.0.0.1`, the session token, and the `Host` and `Origin` checks.
- The HTTP interface under `/api/` and the event WebSocket `/api/events`.
- `<project>/.yumekit/engine.json`, so that a second process finds the running engine.
- The preview server on a second port, and its refresh after each project change.
- The static files of the built editor.

## Interface

```ts
function startEngine(options: {
  projectFolder: string;
  editorFolder?: string;
  port?: number;
}): Promise<Outcome<Engine, EngineFailure>>;

function findRunningEngine(
  projectFolder: string,
): Promise<RunningEngine | undefined>;
```

- `Engine` has `url`, `token`, and `close`. `close` closes the preview server, the media servers, and each renderer browser, and removes `engine.json`.
- `findRunningEngine` reads `engine.json` and asks the engine for `GET /api/health` with the token. It gives `{ url, origin, token }` only when the engine answers for the same folder.

## Rules

- Each request under `/api/` needs `Authorization: Bearer <token>`. A token in the query of an HTTP request does not count.
- The WebSocket takes the token from the query, because a browser cannot set a header on a WebSocket.
- The editor files need no token. They hold no project data.
- A body larger than 10 MB gets status 413.
- The engine never writes a key value to a response, an event, or a log.
