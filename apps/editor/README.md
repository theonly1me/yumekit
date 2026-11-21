# @yumekit/editor

The web editor. `yumekit open` serves the built files. Design: [11-editor-m2.md](../../docs/design/11-editor-m2.md).

## What this package owns

- The Editor screen: the preview, play with sound, the scenes row, and the output switch.
- The Timeline, and the side panel with the tabs Agent, Scene, and Tools.
- Tools and keys: the state of each media server, the key guide, and save, test, and remove of a key.
- Make a clip: the model, its settings and price, the first frame, and the clip in place of a scene.
- The Render sheet: the outputs to render, the progress of each render, and the finished files.
- The Scene panel: the form of a kit scene from its schema, the code of a custom scene, and undo and redo.
- The connection to the engine: the token, the snapshot, and the events.

The app talks to the engine only over HTTP and the event WebSocket. It imports no yumekit package.

## Build and test

```sh
pnpm --filter @yumekit/editor build
pnpm vitest run --project editor-browser
```

The browser tests need the built command (`pnpm typecheck`) and Chromium from Playwright.

## Font

Geist is bundled in `src/styles/fonts`, from the npm package `geist` 1.9.2, under the SIL Open Font License (`Geist-LICENSE.txt`).
