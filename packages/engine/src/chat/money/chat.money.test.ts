import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { bodyOf, rawRequest, withToken } from "../../testing/rawRequest.js";
import { init, result, whole } from "../testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "../testing/chatEngine.js";

const pricedServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../../tools/src/testing/pricedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: ["YUMEKIT_PRICED_KEY"],
};

const userMediaTools = {
  mcpServers: { priced: pricedServer },
  defaults: { video: "priced" },
  limits: { spendingUsd: 3 },
};

const threeClips: FakeStep[] = [
  { print: init },
  {
    callTool: {
      name: "generate_assets",
      input: {
        calls: ["one", "two", "three"].map((assetId) => ({
          asset_id: assetId,
          capability: "video",
          input: { prompt: `a river ${assetId}`, duration_seconds: 4 },
        })),
      },
    },
  },
  { print: whole("The clips cost more than the money left.") },
  { print: result("completed") },
];

const goOn: FakeStep[] = [
  { print: init },
  { print: whole("I go on.") },
  { print: result("completed") },
];

async function chatWithPricedClips() {
  vi.stubEnv("YUMEKIT_PRICED_KEY", "made-up-priced-key");
  const chat = await startChatEngine({ steps: threeClips, userMediaTools });
  const refusedBatch = async () => {
    await chat.writeScenario({ steps: threeClips });
    await chat.ask({ text: "Make the three clips." });
    const { entries } = await chat.waitUntilIdle();
    const warning = entries.findLast((entry) => entry.kind === "money");
    if (warning === undefined) throw new Error("No warning about money.");
    await chat.writeScenario({ steps: goOn });
    return { entries, warning };
  };
  const choose = (options: { id: string; choice: string; byAgent?: boolean }) =>
    rawRequest({
      port: chat.engine.port,
      path: `/api/chat/money/${options.id}`,
      method: "POST",
      headers: withToken({
        token: chat.engine.token,
        headers: {
          "content-type": "application/json",
          ...(options.byAgent === true ? { "x-yumekit-client": "agent" } : {}),
        },
      }),
      body: JSON.stringify({ choice: options.choice }),
    });
  const projectFile = async (): Promise<unknown> => {
    const text = await readFile(
      join(chat.project.projectFolder, "media-tools.json"),
      "utf8",
    ).catch(() => "null");
    const parsed: unknown = JSON.parse(text);
    return parsed;
  };
  const lastRequestText = async () => {
    const { entries } = await chat.waitUntilIdle();
    return entries.findLast((entry) => entry.kind === "request")?.["text"];
  };
  return { refusedBatch, choose, projectFile, lastRequestText };
}

describe("the warning about money in the chat", () => {
  it("shows the estimate, the money left, the raise, and how many fit, and refuses the AI, a second choice, and an old warning", async () => {
    const { refusedBatch, choose, projectFile } = await chatWithPricedClips();

    const first = await refusedBatch();
    const byAi = await choose({
      id: first.warning.id,
      choice: "raise",
      byAgent: true,
    });
    const stopped = await choose({ id: first.warning.id, choice: "stop" });
    const again = await choose({ id: first.warning.id, choice: "raise" });
    const second = await refusedBatch();
    const third = await refusedBatch();

    expect(first.warning).toMatchObject({
      kind: "money",
      what: "clips",
      estimateUsd: 3.6,
      leftUsd: 3,
      raiseToUsd: 5,
      paidCalls: 3,
      callsThatFit: 2,
      choice: null,
    });
    expect([byAi.status, stopped.status, again.status]).toEqual([
      403, 200, 409,
    ]);
    expect(
      third.entries
        .filter((entry) => entry.kind === "money")
        .map((entry) => [entry.id, entry["choice"]]),
    ).toEqual([
      [first.warning.id, "stop"],
      [second.warning.id, "replaced"],
      [third.warning.id, null],
    ]);
    expect(await projectFile()).toBeNull();
  });

  it("asks the lead for fewer clips with no change, and raises the limit of this project and asks the lead to go on", async () => {
    const { refusedBatch, choose, projectFile, lastRequestText } =
      await chatWithPricedClips();

    await choose({ id: (await refusedBatch()).warning.id, choice: "fewer" });
    const fewerText = await lastRequestText();
    const fewerFile = await projectFile();
    const raised = await choose({
      id: (await refusedBatch()).warning.id,
      choice: "raise",
    });

    expect(fewerText).toBe(
      "Make fewer clips. The clips cost about $3.60, and $3.00 is left. Make at most 2, the ones that matter most for the film, and tell me which ones you leave out.",
    );
    expect(fewerFile).toBeNull();
    expect(bodyOf(raised)).toMatchObject({ choice: "raise" });
    expect(await lastRequestText()).toBe(
      "I raised the money of this project to $5.00. Go on with the clips.",
    );
    expect(await projectFile()).toEqual({
      limits: { generatedVideoSeconds: 60, spendingUsd: 5 },
    });
  });
});
