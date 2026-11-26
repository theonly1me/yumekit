import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { callAs, projectWithPersonWork } from "../testing/personWorkFixture.js";
import { filmWork, frameCode, layoutCode } from "./workFixture.js";

describe("put_work with the frame and the work of the person", () => {
  it("names a shared module of the same call as the frame of the video", async () => {
    const harness = await startHarness();

    const put = await harness.call({
      name: "put_work",
      arguments: {
        ...filmWork,
        shared_code: [
          { name: "layout", code: layoutCode },
          { name: "frame", code: frameCode },
        ],
        frame: "frame",
      },
    });
    const work = await harness.call({ name: "get_work" });

    expect(put.data).toMatchObject({ frame: "frame" });
    expect(harness.store.read().project.frame).toBe("frame");
    expect(work.text).toContain('Frame: shared code "frame"');
  });

  it("refuses a frame with no scene as its default export", async () => {
    const harness = await startHarness();

    const put = await harness.call({
      name: "put_work",
      arguments: {
        shared_code: [{ name: "layout", code: layoutCode }],
        frame: "layout",
      },
    });

    expect(put.data).toMatchObject({
      kind: "work-not-valid",
      issues: [{ path: ["frame"] }],
    });
    expect(harness.store.read().project.frame).toBeUndefined();
  });

  it("refuses a timeline that leaves out what the person made, as set_timeline does", async () => {
    const { harness, store } = await projectWithPersonWork();
    const before = JSON.stringify(store.read());

    const put = await callAs({
      harness,
      by: "ai",
      name: "put_work",
      input: {
        scenes: [
          {
            scene_id: "a",
            title: "A",
            kit_component: "title-card",
            props: { heading: "New A" },
          },
        ],
        timelines: [
          {
            output_id: "wide",
            tracks: [
              {
                id: "main",
                kind: "scene",
                clips: [
                  {
                    id: "first",
                    scene_id: "a",
                    start_frame: 0,
                    duration_frames: 90,
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(put.data).toMatchObject({
      kind: "would-remove-the-work-of-the-person",
    });
    expect(JSON.stringify(store.read())).toBe(before);
  });
});
