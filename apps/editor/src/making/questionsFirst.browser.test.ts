import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { storyQuestions } from "../testing/questionRounds.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

describe("questions in the first request", () => {
  it("opens the editor with the question card when the AI asks before it makes the video", async () => {
    const home = await runHome({
      making: {
        calls: [{ name: "ask_person", input: { questions: storyQuestions } }],
        ending: "done",
      },
      mediaTools: { mcpServers: { "local-music": { disabled: true } } },
    });
    homes.push(home);
    const { page, close } = await openEditor(home.url);
    await page.getByLabel("What do you want to make?").fill("A film of a bell");
    await page.getByRole("button", { name: "Make the video" }).click();

    const card = page.getByRole("region", { name: "Questions from the AI" });
    await expect
      .poll(() => card.locator(".question-count").textContent())
      .toBe("Question 1 of 3");
    expect(
      await page.getByRole("heading", { name: "Making your video" }).count(),
    ).toBe(0);
    await home.finishRequest();
    await close();
  });
});
