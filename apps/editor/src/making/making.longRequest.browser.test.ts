import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { longRequestText } from "../testing/longRequest.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const startBoxLimit = 4_000;
const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

describe("the Making screen with a very long request", () => {
  it("folds the request, so the title and the steps stay in the window", async () => {
    const home = await runHome({
      making: { calls: [], ending: "done" },
      mediaTools: { mcpServers: { "local-music": { disabled: true } } },
    });
    homes.push(home);
    const { page, close } = await openEditor(home.url);
    await page
      .getByLabel("What do you want to make?")
      .fill(longRequestText.slice(0, startBoxLimit));
    await page.getByRole("button", { name: "Make the video" }).click();
    const title = page.getByRole("heading", { name: "Making your video" });
    await title.waitFor();

    const titleBottom = await title.evaluate(
      (element) => element.getBoundingClientRect().bottom,
    );
    expect(titleBottom).toBeLessThanOrEqual(900);
    const showAll = page.getByRole("button", { name: "Show all" });
    expect(await showAll.getAttribute("aria-expanded")).toBe("false");

    await showAll.click();

    const request = page.locator(".making-request p");
    expect(
      await request.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Show less" }).click();
    await expect.poll(() => showAll.count()).toBe(1);
    await home.finishRequest();
    await close();
  });
});
