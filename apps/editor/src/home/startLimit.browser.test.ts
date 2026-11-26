import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openProject } from "../testing/editorPage.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

describe("a long request on the start screen", () => {
  it("keeps a brief of 20,000 characters, keeps no more, and says so", async () => {
    const home = await runHome({ making: { calls: [], ending: "done" } });
    homes.push(home);
    const { page, close } = await openProject(home.url);
    const prompt = page.getByLabel("What do you want to make?");
    const limitLine = page
      .getByRole("status")
      .filter({ hasText: "The request is at its limit" });

    await prompt.fill("a".repeat(5_000));
    const beforeLimit = await limitLine.count();
    await prompt.fill("b".repeat(20_500));

    expect(beforeLimit).toBe(0);
    expect((await prompt.inputValue()).length).toBe(20_000);
    expect(await limitLine.innerText()).toBe(
      "The request is at its limit of 20,000 characters, so yumekit keeps no more. Shorten it, or send the rest in the chat after the start.",
    );
    await close();
  });
});
