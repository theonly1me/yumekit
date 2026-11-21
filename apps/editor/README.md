# @yumekit/editor

The web editor. `yumekit open` serves the built files. Design: [11-editor-m2.md](../../docs/design/11-editor-m2.md).

## What this package owns

- The Editor screen: the preview, play with sound, the scenes row, and the output switch.
- The Timeline, and the side panel with the tabs Agent, Scene, and Tools.
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
