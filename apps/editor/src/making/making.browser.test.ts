import { afterAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scriptAndTwoScenes } from "../testing/makingCalls.js";
import {
  runHome,
  type RunningHome,
  type FakeMaking,
} from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

async function startMaking(making: FakeMaking) {
  const home = await runHome({ making });
  homes.push(home);
  const editor = await openEditor(home.url);
  await editor.page.getByLabel("What do you want to make?").fill("Tea");
  await editor.page.getByRole("button", { name: "Make the video" }).click();
  await expect
    .poll(() =>
      editor.page.getByRole("heading", { name: "Making your video" }).count(),
    )
    .toBe(1);
  return { home, ...editor };
}

function stepTexts(page: Awaited<ReturnType<typeof startMaking>>["page"]) {
  return page
    .locator(".making-steps li")
    .evaluateAll((items) =>
      items.map((item) =>
        [item.getAttribute("data-status"), item.textContent].join(" "),
      ),
    );
}

describe("the Making screen", () => {
  it("follows the calls of the first request, shows each scene, and ends in the editor", async () => {
    const { home, page, close } = await startMaking({
      calls: scriptAndTwoScenes,
      ending: "done",
    });

    await expect
      .poll(() => stepTexts(page))
      .toEqual([
        "done Write the scriptThe script is ready",
        "done Make the pictures2 pictures are ready",
        "now Record the voiceWorking",
        "waiting Choose the music",
        "waiting Put it together",
      ]);
    expect(
      await page
        .locator(".making-card:not([data-empty]) > span:not(.thumb)")
        .allTextContents(),
    ).toEqual(["Calm tea", "Warm tea"]);
    await home.finishRequest();
    await expect
      .poll(() => stepTexts(page))
      .toContain("skipped Record the voiceSkipped");
    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await close();
  });

  it("shows the plain message of a failed request and opens the editor on request", async () => {
    const { home, page, close } = await startMaking({
      calls: [],
      ending: "failed",
    });

    await home.finishRequest();

    await expect
      .poll(() =>
        page
          .getByText(
            "The AI stopped with a problem: The model is not available.",
          )
          .count(),
      )
      .toBe(1);
    await page.getByRole("button", { name: "Open the editor" }).click();
    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await close();
  });

  it("stops the request with Stop and shows the editor", async () => {
    const { page, close } = await startMaking({ calls: [], ending: "done" });

    await page.getByRole("button", { name: "Stop" }).click();

    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await close();
  });
});
