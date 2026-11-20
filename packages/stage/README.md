# @yumekit/stage

Draws one output of a project at one frame in the browser. Document 04 in `docs/design` is the design.

## What this package owns

- `createStage`: mounts the visible scene of each scene track, seeks each one, and disposes the scenes that are no longer visible.
- The render mode guards from document 02: a fixed clock, a seeded `Math.random`, no CSS animations or transitions, and no network.

## Tests

The tests run in Chromium through Vitest browser mode. Install the browser once:

```sh
pnpm --filter @yumekit/stage exec playwright install chromium
```
