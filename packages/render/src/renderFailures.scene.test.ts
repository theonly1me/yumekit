import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFrame, renderVideo } from "./index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import {
  callOrderCode,
  guardedRandomCode,
  loggingCode,
  notPermittedImportCode,
  solidColorCode,
  syntaxErrorCode,
  throwingCode,
  unguardedRandomCode,
} from "./testing/sceneCodes.js";
import { failureOf } from "./testing/valueOf.js";

function projectWith(code: string) {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "solid", code: solidColorCode }),
      moduleScene({ sceneId: "tested", code }),
      sceneTracks({
        tracks: [
          [{ id: "back", sceneId: "solid", startFrame: 0, durationFrames: 10 }],
          [
            {
              id: "front",
              sceneId: "tested",
              startFrame: 0,
              durationFrames: 10,
            },
          ],
        ],
      }),
    ],
  });
}

async function videoOf(code: string) {
  const folder = await projectWith(code);
  const destination = join(await temporaryFolder(), "scene.mp4");
  return renderVideo({ folder, outputId: "wide", destination, scale: 0.5 });
}

describe("render failures of scene code", () => {
  it("returns scene-import-not-permitted before it starts a browser", async () => {
    const folder = await projectWith(notPermittedImportCode);
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 0 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "scene-import-not-permitted",
        sceneId: "tested",
        importName: "node:fs/promises",
      },
    });
  });

  it("returns scene-compile-failed with the line and column", async () => {
    const folder = await projectWith(syntaxErrorCode);
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 0 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", sceneId: "tested", line: 4 },
    });
  });

  it("returns scene-error when a scene throws at a frame", async () => {
    const folder = await projectWith(throwingCode);
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 0 }),
    ).resolves.toMatchObject({
      ok: true,
    });
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 2 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-error", sceneId: "tested", frame: 2 },
    });
  });

  it("returns scene-error when a scene logs an error", async () => {
    const folder = await projectWith(loggingCode);
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 3 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-error", sceneId: "tested", frame: 3 },
    });
  });

  it("returns scene-not-repeatable for randomness that the guard does not cover", async () => {
    await expect(videoOf(unguardedRandomCode)).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "scene-not-repeatable",
        sceneIds: ["solid", "tested"],
        frame: 0,
      },
    });
  });

  it("returns scene-not-repeatable for a scene that depends on call order", async () => {
    await expect(videoOf(callOrderCode)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-not-repeatable", frame: 0 },
    });
  });

  it("renders a scene that reads Math.random and the clock, because render mode guards both", async () => {
    await expect(videoOf(guardedRandomCode)).resolves.toMatchObject({
      ok: true,
    });
  });
});

describe("render failures of kit scenes", () => {
  it("returns scene-error when the kit has no scene with that component name", async () => {
    const folder = await createRenderProject({
      edits: [
        {
          kind: "putScene",
          scene: {
            id: "intro",
            title: "Intro",
            notes: "",
            source: { kind: "kit", component: "no-such-scene", props: {} },
          },
        },
        sceneTracks({
          tracks: [
            [
              {
                id: "open",
                sceneId: "intro",
                startFrame: 0,
                durationFrames: 5,
              },
            ],
          ],
        }),
      ],
    });
    const failure = failureOf(
      await renderFrame({ folder, outputId: "wide", frame: 1 }),
    );
    expect(failure).toMatchObject({
      kind: "scene-error",
      sceneId: "intro",
      frame: 1,
    });
    expect(failure.message).toContain('no scene component "no-such-scene"');
  });
});
