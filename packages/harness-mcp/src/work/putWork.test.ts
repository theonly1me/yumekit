import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { filmWork, layoutCode } from "./workFixture.js";

describe("put_work", () => {
  it("writes a three scene film with shared code and a timeline in one call, and one undo removes all of it", async () => {
    const harness = await startHarness();
    const before = harness.store.read();

    const put = await harness.call({ name: "put_work", arguments: filmWork });
    const after = harness.store.read();
    await harness.call({ name: "undo" });
    const undone = harness.store.read();

    expect(put.isError).toBe(false);
    expect(after.revision).toBe(before.revision + 1);
    expect(Object.keys(after.sharedCode)).toEqual(["layout"]);
    expect(after.scenes.map((scene) => scene.id).sort()).toEqual([
      "end",
      "hook",
      "proof",
    ]);
    expect(
      after.timelines[0]?.tracks[0]?.clips.map((clip) => clip.startFrame),
    ).toEqual([0, 60, 120]);
    expect(undone.sharedCode).toEqual({});
    expect(undone.scenes).toEqual([]);
    expect(undone.timelines).toEqual(before.timelines);
  });

  it("changes nothing when one scene of the call does not compile, and names that scene", async () => {
    const harness = await startHarness();
    const before = harness.store.read();
    const [hook, proof, end] = filmWork.scenes;
    const brokenProof = { ...proof, code: "export default defineReactScene(" };

    const put = await harness.call({
      name: "put_work",
      arguments: { ...filmWork, scenes: [hook, brokenProof, end] },
    });

    expect(put.isError).toBe(true);
    expect(put.data).toMatchObject({
      kind: "work-not-valid",
      issues: [{ path: ["scenes", 1] }],
    });
    expect(String(put.data["message"])).toContain('scene "proof"');
    expect(harness.store.read()).toEqual(before);
  });

  it("checks a scene of the call against the shared code of the same call", async () => {
    const harness = await startHarness();
    const [hook] = filmWork.scenes;

    const withoutShared = await harness.call({
      name: "put_work",
      arguments: { scenes: [hook] },
    });
    const withShared = await harness.call({
      name: "put_work",
      arguments: {
        shared_code: [{ name: "layout", code: layoutCode }],
        scenes: [hook],
      },
    });

    expect(withoutShared.data).toMatchObject({ kind: "work-not-valid" });
    expect(JSON.stringify(withoutShared.data["issues"])).toContain(
      "scene-import-not-permitted",
    );
    expect(withShared.isError).toBe(false);
  });

  it("refuses new shared code that breaks a scene that the call keeps", async () => {
    const harness = await startHarness();
    await harness.call({ name: "put_work", arguments: filmWork });

    const put = await harness.call({
      name: "put_work",
      arguments: {
        shared_code: [{ name: "layout", code: "export const other = 1;\n" }],
      },
    });

    expect(put.data).toMatchObject({ kind: "work-not-valid" });
    expect(String(put.data["message"])).toContain(
      "which this call does not change",
    );
    expect(harness.store.read().sharedCode["layout"]).toBe(layoutCode);
  });

  it("takes the times of a timeline in beats", async () => {
    const harness = await startHarness();
    await harness.call({ name: "set_tempo", arguments: { tempo: 120 } });
    const [track] = filmWork.timelines[0].tracks;

    const put = await harness.call({
      name: "put_work",
      arguments: {
        ...filmWork,
        timelines: [
          {
            output_id: "wide",
            tracks: [
              {
                ...track,
                clips: [...track.clips.entries()].map(([index, clip]) => ({
                  id: clip.id,
                  scene_id: clip.scene_id,
                  start_beat: index * 4,
                  duration_beats: 4,
                })),
              },
            ],
          },
        ],
      },
    });

    expect(put.isError).toBe(false);
    expect(
      harness.store
        .read()
        .timelines[0]?.tracks[0]?.clips.map((clip) => [
          clip.startFrame,
          clip.durationFrames,
        ]),
    ).toEqual([
      [0, 60],
      [60, 60],
      [120, 60],
    ]);
  });
});
