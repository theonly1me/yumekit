import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, sharedBrowser } from "../testing/editorPage.js";
import { scriptAndTwoScenes } from "../testing/makingCalls.js";
import {
  fitsTheWindow,
  openPhonePage,
  pageWidthOf,
} from "../testing/pageWidth.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

const typedRequest = "A calm tea ad";

describe("the start screen and the project screen on a phone", () => {
  it("fit 390 pixels, and the chat shows only the words that the person typed", async () => {
    const home = await runHome({
      making: { calls: scriptAndTwoScenes, ending: "done" },
    });
    homes.push(home);
    const { page, close } = await openPhonePage({
      browser: await sharedBrowser(),
      url: home.url,
    });
    await page.getByRole("button", { name: "A video" }).waitFor();
    await page.getByLabel("What do you want to make?").fill(typedRequest);
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);

    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page
      .getByRole("heading", { name: "The lead reads your request" })
      .waitFor();
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);

    await home.finishRequest();
    const request = page.locator(".entry.you p").first();
    await expect.poll(() => request.innerText()).toBe(typedRequest);
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);
    await close();
  });
});
