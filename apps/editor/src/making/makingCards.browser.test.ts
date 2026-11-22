import type { Page, Route } from "playwright";
import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scriptAndTwoScenes } from "../testing/makingCalls.js";
import { browsersPath } from "../testing/runEngine.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

async function openTallMaking(options: { withChromium: boolean }) {
  const home = await runHome({
    making: { calls: scriptAndTwoScenes, ending: "done" },
    ...(options.withChromium ? { browsersPath: browsersPath() } : {}),
  });
  homes.push(home);
  return { home, ...(await openEditor(home.url)) };
}

async function startTallRequest(page: Page): Promise<void> {
  await page.getByLabel("What do you want to make?").fill("Tea");
  await page.getByRole("button", { name: /^YouTube 16:9/ }).click();
  await page.getByRole("button", { name: /^TikTok/ }).click();
  await page.getByRole("button", { name: /^Instagram Reel/ }).click();
  await page.getByRole("button", { name: "Make the video" }).click();
}

function cardFacts(page: Page) {
  return page
    .locator(".making-card:not([data-empty]) .thumb")
    .evaluateAll((thumbs) =>
      thumbs.map((thumb) => {
        const box = thumb.getBoundingClientRect();
        const image = thumb.querySelector("img");
        return {
          isTall: box.height > box.width * 1.7,
          naturalSize:
            image === null ? null : [image.naturalWidth, image.naturalHeight],
        };
      }),
    );
}

describe("the Making cards", () => {
  it("show each scene with no clip in the tall shape of the output", async () => {
    const { page, close } = await openTallMaking({ withChromium: true });

    await startTallRequest(page);

    await expect
      .poll(() => cardFacts(page), { timeout: 60_000 })
      .toEqual([
        { isTall: true, naturalSize: [540, 960] },
        { isTall: true, naturalSize: [540, 960] },
      ]);
    await close();
  }, 120_000);

  it("say Making the picture until the picture comes, and No picture when it cannot be made", async () => {
    const { page, close } = await openTallMaking({ withChromium: false });
    const heldRequests: Route[] = [];
    await page.route("**/api/tools/preview_scenes", (route) => {
      heldRequests.push(route);
    });

    await startTallRequest(page);

    const cardTexts = () =>
      page.locator(".making-card:not([data-empty])").allTextContents();
    await expect
      .poll(cardTexts)
      .toEqual(["Making the pictureCalm tea", "Making the pictureWarm tea"]);
    await Promise.all(heldRequests.map((route) => route.fallback()));
    await page.unroute("**/api/tools/preview_scenes");
    await expect
      .poll(cardTexts)
      .toEqual(["No pictureCalm tea", "No pictureWarm tea"]);
    await close();
  });
});
