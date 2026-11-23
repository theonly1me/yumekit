import { describe, expect, it } from "vitest";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Scene, Snapshot } from "../engine/snapshot.js";
import { picturesOf } from "../parts/pictures/useScenePictures.js";

const wide: Output = {
  id: "wide",
  label: "wide",
  widthPixels: 1920,
  heightPixels: 1080,
};

interface ToolCall {
  name: string;
  input: object;
}

function recordingClient(options: { failing?: boolean } = {}) {
  const calls: ToolCall[] = [];
  const client: Pick<EngineClient, "callTool"> = {
    callTool: (call) => {
      calls.push({ name: call.name, input: call.input });
      const count =
        "frames" in call.input && Array.isArray(call.input.frames)
          ? call.input.frames.length
          : 1;
      return Promise.resolve({
        ok: true,
        value: {
          isError: options.failing === true,
          text: "",
          data: {},
          images: Array.from({ length: count }, (...[, index]) => ({
            mimeType: "image/png",
            base64: `picture-${String(calls.length)}-${String(index)}`,
          })),
        },
      });
    },
  };
  return { client, calls };
}

function titleScene(options: { id: string; heading: string }): Scene {
  return {
    id: options.id,
    title: options.id,
    notes: "",
    source: {
      kind: "kit",
      component: "title-card",
      props: { heading: options.heading },
    },
  };
}

function projectOf(options: {
  headings: string[];
  look?: string;
  order?: number[];
}): Snapshot {
  const scenes = options.headings.map((...[heading, index]) =>
    titleScene({ id: `scene-${String(index)}`, heading }),
  );
  const order = options.order ?? scenes.map((...[, index]) => index);
  return {
    revision: 1,
    project: {
      name: "Test",
      framesPerSecond: 30,
      outputs: [wide],
      look: options.look ?? "paper",
    },
    bible: { cast: [] },
    script: "",
    scenes,
    sceneCode: {},
    timelines: [
      {
        outputId: "wide",
        tracks: [
          {
            id: "scenes",
            kind: "scene",
            clips: order.map((...[sceneIndex, position]) => ({
              id: `clip-${String(sceneIndex)}`,
              sceneId: `scene-${String(sceneIndex)}`,
              startFrame: position * 90,
              durationFrames: 90,
              sceneStartFrame: 0,
            })),
          },
        ],
      },
    ],
    assets: [],
  };
}

function cardsOf(options: {
  client: Pick<EngineClient, "callTool">;
  snapshot: Snapshot;
  unplacedSceneIds?: string[];
}) {
  const tracks = options.snapshot.timelines[0]?.tracks ?? [];
  return picturesOf({
    client: options.client,
    snapshot: options.snapshot,
    output: wide,
    scale: 0.25,
    clips: tracks.flatMap((track) =>
      track.kind === "scene" ? track.clips : [],
    ),
    unplacedSceneIds: options.unplacedSceneIds ?? [],
  });
}

function framesOf(call: ToolCall | undefined): unknown {
  return call !== undefined && "frames" in call.input
    ? call.input.frames
    : undefined;
}

describe("the scene pictures of the editor", () => {
  it("asks only for the picture of the scene that changed", async () => {
    const { client, calls } = recordingClient();
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two", "Three"] }),
    });
    const changed = await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two, new", "Three"] }),
    });

    expect(calls.map((call) => call.name)).toEqual([
      "preview_frames",
      "preview_frames",
    ]);
    expect(framesOf(calls[1])).toEqual([158]);
    expect(changed.get("clip/clip-0")).toEqual({
      kind: "ready",
      source: "data:image/png;base64,picture-1-0",
    });
  });

  it("asks for no picture when the same pictures are asked again or the scenes move", async () => {
    const { client, calls } = recordingClient();
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two"] }),
    });
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two"] }),
    });
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two"], order: [1, 0] }),
    });

    expect(calls).toHaveLength(1);
  });

  it("asks for each picture again after a change of the look", async () => {
    const { client, calls } = recordingClient();
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two"] }),
    });
    await cardsOf({
      client,
      snapshot: projectOf({ headings: ["One", "Two"], look: "midnight" }),
    });

    expect(framesOf(calls[1])).toEqual([68, 158]);
  });

  it("asks again for a picture that failed", async () => {
    const failing = recordingClient({ failing: true });
    const first = await cardsOf({
      client: failing.client,
      snapshot: projectOf({ headings: ["Alone"] }),
    });
    await cardsOf({
      client: failing.client,
      snapshot: projectOf({ headings: ["Alone"] }),
    });

    expect(first.get("clip/clip-0")).toEqual({ kind: "failed" });
    expect(failing.calls).toHaveLength(2);
  });
});
