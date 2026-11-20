# @yumekit/scene

The scene contract, the React adapter, and the animation functions. Document 02 in `docs/design` is the design.

## What this package owns

- The contract that the stage, the renderer, and the editor preview use: `SceneModule`.
- The React adapter: `defineReactScene`, `useFrame`, `useSceneContext`, `useHold`, `FrameWindow`, and `VideoFrame`.
- `VideoFrame` draws one frame of a video asset from its frame pictures. Document 09 has the rules.
- Pure animation functions: `tween`, `spring`, `stagger`, `easings`, and `seededRandom`.

## Tests

The React adapter tests run in Chromium through Vitest browser mode. Install the browser once:

```sh
pnpm --filter @yumekit/scene exec playwright install chromium
```
