import { describe, expect, it } from "vitest";
import { renderFrame } from "../index.js";
import { decodePng } from "../testing/decodePng.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { valueOf } from "../testing/valueOf.js";

const beatBarCode = `import { defineReactScene, useSceneContext } from "@yumekit/scene";

export default defineReactScene(() => {
  const { beatFrames } = useSceneContext();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000" }}>
      <div style={{ width: (beatFrames ?? 0) * 10, height: 180, background: "#ff0000" }} />
    </div>
  );
});
`;

async function barPicture(edits: { tempo?: number }) {
  const folder = await createRenderProject({
    edits: [
      ...(edits.tempo === undefined
        ? []
        : [{ kind: "setTempo" as const, tempo: edits.tempo }]),
      moduleScene({ sceneId: "bar", code: beatBarCode }),
      sceneTracks({
        tracks: [
          [{ id: "bar", sceneId: "bar", startFrame: 0, durationFrames: 5 }],
        ],
      }),
    ],
  });
  return decodePng(
    valueOf(await renderFrame({ folder, outputId: "wide", frame: 0 })).png,
  );
}

describe("the beat of the project in a scene", () => {
  it("gives a scene beatFrames 15 at tempo 120 and 30 frames each second", async () => {
    const picture = await barPicture({ tempo: 120 });

    expect(picture.pixelAt({ x: 145, y: 90 })).toEqual([255, 0, 0]);
    expect(picture.pixelAt({ x: 155, y: 90 })).toEqual([0, 0, 0]);
  });

  it("gives a scene no beatFrames when the project has no tempo", async () => {
    const picture = await barPicture({});

    expect(picture.pixelAt({ x: 5, y: 90 })).toEqual([0, 0, 0]);
  });
});
