import { access } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { takeDraftFileOf } from "../takeDrafts/takeDraftFile.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { leadReads, startWithReadyTake } from "../testing/readyTake.js";

type ChatEngine = Awaited<ReturnType<typeof startWithReadyTake>>;

const harborDraft = {
  verdict: "change",
  tags: ["Wrong place"],
  note: "The wall is too low.",
  pins: [{ id: "pin-a", x: 0.25, y: 0.5, text: "Make it taller." }],
  moments: [],
  quotes: [],
};

function draftRequest(options: {
  chat: ChatEngine;
  path: string;
  method?: string;
  body?: object;
  isAgent?: boolean;
}) {
  const { engine } = options.chat;
  return rawRequest({
    port: engine.port,
    path: options.path,
    method: options.method ?? "GET",
    headers: withToken({
      token: engine.token,
      headers: {
        "content-type": "application/json",
        ...(options.isAgent === true ? { "x-yumekit-client": "agent" } : {}),
      },
    }),
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

describe("the draft of a review", { timeout: 120_000 }, () => {
  it("keeps the review of each item as the person writes it, and a new read gives it back", async () => {
    const chat = await startWithReadyTake();

    const saved = await draftRequest({
      chat,
      path: "/api/take-drafts/take-1/harbor",
      method: "PUT",
      body: harborDraft,
    });
    await draftRequest({
      chat,
      path: "/api/take-drafts/take-1/ferry",
      method: "PUT",
      body: { ...harborDraft, verdict: "approved", tags: [], pins: [] },
    });
    const read = await draftRequest({ chat, path: "/api/take-drafts/take-1" });

    expect(saved.status).toBe(200);
    expect(JSON.parse(read.body)).toEqual({
      items: {
        harbor: harborDraft,
        ferry: { ...harborDraft, verdict: "approved", tags: [], pins: [] },
      },
    });
  });

  it("refuses the AI, and a draft of a take that is sent", async () => {
    const chat = await startWithReadyTake();
    await chat.writeScenario({ steps: leadReads([]) });
    await draftRequest({
      chat,
      path: "/api/take-drafts/take-1/harbor",
      method: "PUT",
      body: harborDraft,
    });
    const file = takeDraftFileOf({
      projectFolder: chat.project.projectFolder,
      draftId: "take-1",
    });
    const isKeptBeforeTheSend = await exists(file);

    const byAgent = await draftRequest({
      chat,
      path: "/api/take-drafts/take-1/harbor",
      method: "PUT",
      body: harborDraft,
      isAgent: true,
    });
    await chat.post({ path: "/api/takes/take-1/send" });
    await chat.waitUntilIdle();
    const late = await draftRequest({
      chat,
      path: "/api/take-drafts/take-1/harbor",
      method: "PUT",
      body: harborDraft,
    });

    expect(byAgent.status).toBe(403);
    expect(isKeptBeforeTheSend).toBe(true);
    expect(await exists(file)).toBe(false);
    expect(late.status).toBe(409);
    expect(JSON.parse(late.body)).toMatchObject({ kind: "take-already-sent" });
  });
});
