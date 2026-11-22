# @yumekit/editor

The web editor. `yumekit open` serves the built files. Design: [13-editor-prompt-first.md](../../docs/design/13-editor-prompt-first.md) for the layout, and [11-editor-m2.md](../../docs/design/11-editor-m2.md) for the engine, the preview, and the agent setup.

## What this package owns

- The top bar: the project name, the theme, Settings, and Export.
- The platform tabs, "Add a platform", the preview, and play with sound.
- The scene cards with the actions of a picked card, the sound rows, and the detailed timeline.
- The side panel with the tabs Chat and Scene. The Chat tab shows the agent setup until the chat comes.
- The Scene tab: the name and the length, the form of a kit scene from its schema, the code of a custom scene, and undo and redo.
- Make a real video clip: the model, its settings and price, the first picture, and the clip in place of a scene.
- Export: one row for each platform, the progress, and the finished files.
- Settings: media tools and keys, the limit of generated video, and the agent setup.
- The connection to the engine: the token, the snapshot, and the events.

The app talks to the engine only over HTTP and the event WebSocket. At run time it imports only `@yumekit/project/scenes-row` and `@yumekit/project/platforms`.

## Build and test

```sh
pnpm --filter @yumekit/editor build
pnpm vitest run --project editor-browser
```

The browser tests need the built command (`pnpm typecheck`) and Chromium from Playwright.

## Font

Geist is bundled in `src/styles/fonts`, from the npm package `geist` 1.9.2, under the SIL Open Font License (`Geist-LICENSE.txt`).
