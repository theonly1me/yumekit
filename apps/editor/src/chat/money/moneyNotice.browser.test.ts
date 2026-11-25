import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  chatOf,
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import type { FakeStep } from "../../testing/fakeAgent.js";
import { withoutOtherBundled } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

const pricedServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../../../packages/tools/src/testing/pricedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: ["YUMEKIT_PRICED_KEY"],
};

const ownLimitsSchema = z.object({
  limits: z.object({ spendingUsd: z.number() }),
});

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const threeClips: FakeStep[] = [
  { print: claudeLines.init },
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
  { print: claudeLines.whole("The clips cost more than the money left.") },
  { print: claudeLines.result("completed") },
];

async function moneyLimitOfProject(): Promise<number> {
  const text = await readFile(
    join(runningEngine().projectFolder, "media-tools.json"),
    "utf8",
  );
  return ownLimitsSchema.parse(JSON.parse(text)).limits.spendingUsd;
}

beforeAll(async () => {
  engine = await runEngine({
    fakeAgent: true,
    environment: { YUMEKIT_PRICED_KEY: "made-up-priced-key" },
    mediaTools: {
      mcpServers: { priced: pricedServer, ...withoutOtherBundled },
      defaults: { video: "priced" },
      limits: { spendingUsd: 3 },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the warning about money in the chat", () => {
  it("shows the price and the money left with three choices, and each choice does what it says", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: { steps: threeClips },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    const warning = chat.history.locator('.money-notice[data-open="true"]');
    const choice = (name: string | RegExp) =>
      warning.getByRole("button", { name }).click();

    await chat.ask("Make the three clips.");
    await expect.poll(() => warning.count()).toBe(1);
    expect(await warning.locator("p").innerText()).toBe(
      "The clips cost about $3.60 and $3.00 is left. Nothing is spent until you pick.",
    );
    expect(await warning.getByRole("button").allInnerTexts()).toEqual([
      "Raise this project to $5",
      "Make fewer clips (2)",
      "Stop here",
    ]);
    await choice("Stop here");
    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual([
        "The clips cost about $3.60 and $3.00 is left. You stopped here. Nothing was spent.",
      ]);
    expect(await moneyLimitOfProject()).toBe(3);

    await chat.ask("Make the three clips.");
    await expect.poll(() => warning.count()).toBe(1);
    await choice(/^Make fewer clips/);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(
        "Make fewer clips. The clips cost about $3.60, and $3.00 is left. Make at most 2",
      );
    await expect
      .poll(() =>
        chat.history.getByText("You asked the lead for fewer clips.").count(),
      )
      .toBe(1);
    await expect.poll(() => warning.count()).toBe(1);

    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { print: claudeLines.whole("I go on with the clips.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    await choice("Raise this project to $5");

    await expect.poll(() => moneyLimitOfProject()).toBe(5);
    await expect.poll(() => warning.count()).toBe(0);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(
        "I raised the money of this project to $5.00. Go on with the clips.",
      );
    expect(
      await chat.history.getByText("You raised this project to $5.").count(),
    ).toBe(1);
    await editor.close();
  });
});
