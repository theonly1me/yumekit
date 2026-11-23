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
  const home = await runHome({
    making,
    mediaTools: { mcpServers: { "local-music": { disabled: true } } },
  });
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
  it("follows the calls of the first request, says why the music is missing, and stays when the video is ready", async () => {
    const { home, page, close } = await startMaking({
      calls: scriptAndTwoScenes,
      ending: "done",
    });

    await expect
      .poll(() => stepTexts(page))
      .toEqual([
        "done Write the scriptThe script is readyOpen now",
        "done Make the pictures2 pictures are readySee and change",
        "now Record the voiceWorking",
        "waiting Choose the music",
        "waiting Put it together",
      ]);
    await home.finishRequest();
    await expect
      .poll(() => stepTexts(page))
      .toContain("skipped Record the voiceSkipped");
    await expect
      .poll(() => stepTexts(page))
      .toContain(
        "skipped Choose the musicNo music yet. Music needs a key, or your own file.Add a keyUse my own music",
      );
    await expect
      .poll(() =>
        page.getByRole("heading", { name: "Your video is ready" }).count(),
      )
      .toBe(1);
    await page.waitForTimeout(2_000);
    expect(await page.getByRole("button", { name: "Export" }).count()).toBe(0);

    await page.getByRole("button", { name: "Open the editor" }).first().click();

    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await close();
  });

  it("opens the first done step by itself, locks it while the request runs, and opens it after the answer", async () => {
    const { home, page, close } = await startMaking({
      calls: scriptAndTwoScenes,
      ending: "done",
    });
    const scriptPage = page.getByRole("textbox", {
      name: "The script of the video",
    });
    const lockedLine = page.getByText("The AI still works on the video.", {
      exact: false,
    });

    await expect.poll(() => scriptPage.locator("h1").textContent()).toBe("Tea");
    expect(await scriptPage.locator("strong").textContent()).toBe("calm");
    expect(await scriptPage.getAttribute("contenteditable")).toBe("false");
    expect(await page.getByRole("button", { name: "Bold" }).isDisabled()).toBe(
      true,
    );
    expect(await lockedLine.count()).toBe(1);

    await home.finishRequest();

    await expect
      .poll(() => scriptPage.getAttribute("contenteditable"))
      .toBe("true");
    expect(await lockedLine.count()).toBe(0);
    await page.getByRole("button", { name: /^Make the pictures/ }).click();
    await expect
      .poll(() =>
        page.locator(".picture-card > span:not(.picture)").allTextContents(),
      )
      .toEqual(["1. Calm tea", "2. Warm tea"]);
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

  it("stops the request with Stop, and shows the editor with open views", async () => {
    const { page, close } = await startMaking({ calls: [], ending: "done" });

    await page.getByRole("button", { name: "Stop" }).click();

    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await page.getByRole("button", { name: "Script", exact: true }).click();
    expect(await page.getByRole("button", { name: "Bold" }).isDisabled()).toBe(
      false,
    );
    await close();
  });
});
