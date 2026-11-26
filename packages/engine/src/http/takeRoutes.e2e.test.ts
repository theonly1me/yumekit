import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { z } from "zod";
import type { FakeStep } from "../chat/testing/chatEngine.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import {
  lastRequestOf,
  leadReads,
  startWithReadyTake,
} from "../testing/readyTake.js";

function clipCall(saveResultTo: string): FakeStep {
  return {
    callTool: {
      name: "generate_asset",
      input: {
        asset_id: "harbor-clip",
        capability: "video",
        input: { prompt: "the fog moves", duration_seconds: 1 },
        first_frame_asset_id: "harbor",
      },
      saveResultTo,
    },
  };
}

async function kindOf(file: string): Promise<unknown> {
  const saved = z
    .object({ data: z.object({ kind: z.string().optional() }) })
    .parse(JSON.parse(await readFile(file, "utf8")));
  return saved.data.kind;
}

const takesSchema = z.object({
  takes: z.array(
    z.looseObject({ state: z.string(), notes: z.array(z.unknown()) }),
  ),
  chapters: z.array(z.looseObject({ id: z.string() })),
  approvePicturesFirst: z.boolean(),
});

describe("the take routes", { timeout: 120_000 }, () => {
  it("a send with a pinned note starts the lead's turn with the note and the approved items", async () => {
    const chat = await startWithReadyTake();
    await chat.writeScenario({ steps: leadReads([]) });

    const sent = await chat.post({
      path: "/api/takes/take-1/send",
      body: {
        notes: [
          {
            item_id: "harbor",
            text: "Make the wall taller.",
            pin: { x: 0.25, y: 0.5 },
          },
        ],
      },
    });
    const { entries } = await chat.waitUntilIdle();

    expect(sent.status).toBe(202);
    const request = lastRequestOf(await chat.runs());
    expect(request).toContain(
      '   Pin 1 at 25% from the left and 50% from the top: "Make the wall taller."',
    );
    expect(request).toContain('Approved, so keep them as they are: "ferry".');
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: "request",
        text: "Take 1 of the pictures: 1 to change.",
      }),
    );
    const listed = await rawRequest({
      port: chat.engine.port,
      path: "/api/takes",
      headers: withToken(chat.engine),
    });
    const takes = takesSchema.parse(JSON.parse(listed.body));
    expect(takes.takes[0]).toMatchObject({ state: "sent" });
    expect(takes.chapters.map((chapter) => chapter.id)).toEqual(["film"]);
    expect(takes.approvePicturesFirst).toBe(true);
  });

  it("a send with no notes tells the lead to go on, and opens the clip of an approved picture", async () => {
    const folder = await mkdtemp(join(tmpdir(), "yumekit-take-"));
    onTestFinished(() => rm(folder, { recursive: true, force: true }));
    const before = join(folder, "before.json");
    const after = join(folder, "after.json");
    const chat = await startWithReadyTake([clipCall(before)]);
    await chat.writeScenario({ steps: leadReads([clipCall(after)]) });

    const sent = await chat.post({ path: "/api/takes/take-1/send" });
    await chat.waitUntilIdle();

    expect(sent.status).toBe(202);
    expect(lastRequestOf(await chat.runs())).toContain(
      "with no change, so each item is approved",
    );
    expect(await kindOf(before)).toBe("picture-not-approved");
    expect(await kindOf(after)).not.toBe("picture-not-approved");
  });

  it("only the person can send a take, and only a ready take", async () => {
    const chat = await startWithReadyTake();
    await chat.writeScenario({ steps: leadReads([]) });

    const byAgent = await rawRequest({
      port: chat.engine.port,
      path: "/api/takes/take-1/send",
      method: "POST",
      headers: withToken({
        token: chat.engine.token,
        headers: {
          "content-type": "application/json",
          "x-yumekit-client": "agent",
        },
      }),
      body: "{}",
    });
    await chat.post({ path: "/api/takes/take-1/send" });
    await chat.waitUntilIdle();
    const again = await chat.post({ path: "/api/takes/take-1/send" });

    expect(byAgent.status).toBe(403);
    expect(again.status).toBe(409);
    expect(JSON.parse(again.body)).toMatchObject({ kind: "take-not-ready" });
  });
});
