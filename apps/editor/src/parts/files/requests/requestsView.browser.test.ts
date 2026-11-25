import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../../../testing/counterProject.js";
import { closeBrowser, openEditor } from "../../../testing/editorPage.js";
import { withoutOtherBundled } from "../../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../../testing/runEngine.js";
import { openStepSheet } from "../../../testing/stepViews.js";
import { noRequestsText } from "./RequestsView.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
    mediaTools: { mcpServers: { sample: {}, ...withoutOtherBundled } },
  });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function picture(options: { assetId: string; server: string }) {
  return runningEngine().callTool({
    name: "generate_asset",
    input: {
      asset_id: options.assetId,
      capability: "image",
      server: options.server,
      input: {
        prompt: "A red fox on a stone wall at dawn, watercolor.",
        width_pixels: 64,
        height_pixels: 36,
      },
    },
  });
}

async function openRequests() {
  const editor = await openEditor(runningEngine().url);
  await openStepSheet({ page: editor.page, name: "Files" });
  await editor.page.getByRole("tab", { name: "Requests" }).click();
  return editor;
}

describe("the Requests view in Files", () => {
  it("says what it shows before the first request", async () => {
    const editor = await openRequests();

    await expect
      .poll(() => editor.page.getByText(noRequestsText).count())
      .toBe(1);
    await editor.close();
  });

  it("shows each request the newest first: a failed one with its reason, a made one with its prompt as sent", async () => {
    await picture({ assetId: "fox", server: "sample" });
    await picture({ assetId: "fox-again", server: "nowhere" }).catch(
      (error: unknown) => error,
    );
    const editor = await openRequests();
    const rows = editor.page.getByRole("list", { name: "Requests" });

    await expect.poll(() => rows.getByRole("listitem").count()).toBe(2);
    const [failed, made] = await rows.getByRole("listitem").allInnerTexts();
    expect(failed).toContain("Failed");
    expect(failed).toContain('No media server is named "nowhere".');
    expect(failed).toContain("server-not-found");
    expect(made).toContain("Made");
    expect(made).toContain("Prompt as sent, 46 characters");
    expect(made).toContain("A red fox on a stone wall at dawn, watercolor.");
    expect(made).toContain("64 by 36");
    await editor.page.getByLabel("Only the failed ones").check();
    await expect.poll(() => rows.getByRole("listitem").count()).toBe(1);
    await editor.close();
  });
});
