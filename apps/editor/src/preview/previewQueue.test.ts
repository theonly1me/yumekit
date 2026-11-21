import { describe, expect, it } from "vitest";
import { createPreviewQueue, type SeekMessage } from "./previewQueue.js";

function recordingQueue() {
  const sent: SeekMessage[] = [];
  const failures: unknown[] = [];
  const queue = createPreviewQueue({
    send: (message) => {
      sent.push(message);
    },
    onFailure: (failure) => {
      failures.push(failure);
    },
  });
  return { queue, sent, failures };
}

describe("createPreviewQueue", () => {
  it("asks for a frame only after the page answered the last one, and then asks for the newest frame", () => {
    const { queue, sent } = recordingQueue();
    queue.receive({ type: "ready", frameCount: 100 });

    queue.show(1);
    queue.show(2);
    queue.show(3);
    const beforeAnswer = sent.map((message) => message.frame);
    queue.receive({ type: "sought", requestId: 1 });

    expect(beforeAnswer).toEqual([1]);
    expect(sent.map((message) => message.frame)).toEqual([1, 3]);
  });

  it("sends nothing before the page is ready", () => {
    const { queue, sent } = recordingQueue();

    queue.show(5);
    const beforeReady = sent.length;
    queue.receive({ type: "ready", frameCount: 10 });

    expect(beforeReady).toBe(0);
    expect(sent).toEqual([{ type: "seek", frame: 5, requestId: 1 }]);
  });

  it("reports the failure of a scene with its frame, and clears it after the next drawn frame", () => {
    const { queue, failures } = recordingQueue();
    queue.receive({ type: "ready", frameCount: 10 });
    queue.show(4);

    queue.receive({
      type: "failed",
      requestId: 1,
      kind: "scene-error",
      message: "Boom",
      sceneId: "broken",
    });
    queue.show(5);
    queue.receive({ type: "sought", requestId: 2 });

    expect(failures.slice(1)).toEqual([
      {
        frame: 4,
        kind: "scene-error",
        message: "Boom",
        sceneId: "broken",
      },
      undefined,
    ]);
  });
});
