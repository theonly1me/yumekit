import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../testing/chatTesting.js";
import {
  closeBrowser,
  openProject,
  type EditorPage,
} from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import {
  openPicturesTake,
  pictureIds,
  readyCutTake,
  readyMusicTake,
  readyTake,
} from "../testing/takeProject.js";
import { forgeStory } from "../testing/wholeStory.js";
import { storyYesText } from "./work/storyRequests.js";

let engine: RunningEngine | undefined;
let project: EditorPage | undefined;

function running(): { engine: RunningEngine; project: EditorPage } {
  if (engine === undefined || project === undefined) {
    throw new Error("The engine did not start");
  }
  return { engine, project };
}

const answered = {
  steps: [
    { print: claudeLines.init },
    { print: claudeLines.whole("I go on.") },
    { print: claudeLines.result("completed") },
  ],
};

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await setScenario({ engine, scenario: answered });
  project = await openProject(engine.url);
});

afterAll(async () => {
  await project?.close();
  await closeBrowser();
  await engine?.remove();
});

describe("the work area of the project screen", () => {
  it("opens on the project screen, and Edit by hand goes to the editor and back", async () => {
    const { page } = running().project;
    const work = page.getByRole("main");

    await expect.poll(() => work.innerText()).toContain("Nothing made yet");
    await page.getByRole("button", { name: "Edit by hand" }).click();
    await page.getByRole("button", { name: "Back to the project" }).click();
    await expect.poll(() => work.innerText()).toContain("Nothing made yet");
  });

  it("shows the story to read, and its approval asks the lead in the chat when no take holds it", async () => {
    const { page } = running().project;
    await running().engine.callTool({ name: "set_story", input: forgeStory });

    await page.getByText(forgeStory.premise).waitFor();
    await page.getByRole("button", { name: "Approve the story" }).click();

    await expect
      .poll(async () => (await requestTextsSent(running().engine)).at(-1))
      .toContain(storyYesText);
  });

  it("shows the lead at work with each picture as it arrives", async () => {
    const { engine: runningEngine, project: opened } = running();
    await runningEngine.callTool({
      name: "set_story",
      input: { ...forgeStory, approval: "person-said-yes" },
    });
    await openPicturesTake({ engine: runningEngine, assetIds: ["ferry"] });

    await opened.page.getByText("1 picture made so far").waitFor();
    expect(await opened.page.getByRole("article").count()).toBe(1);
  });

  it("shows a ready take as rows to review in place, with the next step", async () => {
    const { engine: runningEngine, project: opened } = running();
    await runningEngine.callTool({
      name: "generate_assets",
      input: {
        calls: pictureIds.slice(1).map((assetId) => ({
          asset_id: assetId,
          capability: "image",
          server: "sample",
          input: {
            prompt: `The ${assetId} in fog`,
            width_pixels: 320,
            height_pixels: 180,
          },
        })),
      },
    });
    await readyTake({
      engine: runningEngine,
      items: pictureIds.map((id) => ({ id })),
    });

    const next = opened.page.getByRole("button", { name: /^All good/ });
    await expect.poll(() => next.innerText()).toBe("All good. Make the clips");
    expect(
      await opened.page
        .getByRole("region", { name: "Pictures" })
        .getByRole("article")
        .count(),
    ).toBe(3);
    await next.click();
    await expect
      .poll(async () => (await requestTextsSent(runningEngine)).at(-1))
      .toContain("Take 1 of the pictures: all good. Go on.");
  });

  it("shows the cut of the chapter in a player, with Approve the cut", async () => {
    const { engine: runningEngine, project: opened } = running();
    await readyMusicTake(runningEngine);
    await opened.page
      .getByRole("button", { name: "All good. Make the cut" })
      .click();
    await expect
      .poll(async () => (await requestTextsSent(runningEngine)).at(-1))
      .toContain("Take 2 of the clips: all good. Go on.");
    await readyCutTake(runningEngine);

    await opened.page
      .getByRole("button", { name: "Approve the cut" })
      .waitFor();
    expect(await opened.page.locator(".film video").count()).toBe(1);
    expect(
      await opened.page.getByText("Watch it once at full speed.").count(),
    ).toBeGreaterThan(0);
  });
});
