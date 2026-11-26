import type { Page, Route } from "playwright";
import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { scriptAndTwoScenes } from "../../testing/makingCalls.js";
import { browsersPath } from "../../testing/runEngine.js";
import { runHome, type RunningHome } from "../../testing/runHome.js";

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
  return { home, ...(await openProject(home.url)) };
}

async function startTallRequest(page: Page): Promise<void> {
  await page.getByLabel("What do you want to make?").fill("Tea");
  await page.getByRole("button", { name: "Change" }).click();
  await page.getByRole("button", { name: /^YouTube 16:9/ }).click();
  await page.getByRole("button", { name: /^TikTok/ }).click();
  await page.getByRole("button", { name: /^Instagram Reel/ }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Edit by hand" }).click();
  await page.getByRole("button", { name: "Pictures", exact: true }).click();
}

function cardFacts(page: Page) {
  return page.locator(".picture-card .picture").evaluateAll((thumbs) =>
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

describe("the scene cards of the Pictures view", () => {
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

    const cardTexts = () => page.locator(".picture-card").allTextContents();
    await expect
      .poll(cardTexts)
      .toEqual([
        "Making the picture1. Calm tea",
        "Making the picture2. Warm tea",
      ]);
    await Promise.all(heldRequests.map((route) => route.fallback()));
    await page.unroute("**/api/tools/preview_scenes");
    await expect
      .poll(cardTexts)
      .toEqual(["No picture1. Calm tea", "No picture2. Warm tea"]);
    await close();
  });
});
