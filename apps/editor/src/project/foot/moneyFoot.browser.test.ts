import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatOf, claudeLines, setScenario } from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
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

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
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
  await setScenario({
    engine,
    scenario: {
      steps: [
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
        {
          print: claudeLines.whole("The clips cost more than the money left."),
        },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the warning about money on the project screen", () => {
  it("takes the place of the next action with its three choices, and leaves the chat", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const foot = page.locator(".money-foot");

    await chatOf(page).ask("Make the three clips.");

    await expect
      .poll(() => foot.locator("p").innerText())
      .toBe(
        "The clips cost about $3.60 and $3.00 is left. Nothing is spent until you pick.",
      );
    expect(await foot.getByRole("button").allInnerTexts()).toEqual([
      "Raise this project to $5",
      "Make fewer clips (2)",
      "Stop here",
    ]);
    expect(
      await chatOf(page)
        .history.locator('.money-notice[data-open="true"]')
        .count(),
    ).toBe(0);
    await foot.getByRole("button", { name: "Stop here" }).click();
    await expect.poll(() => foot.count()).toBe(0);
    await close();
  });
});
