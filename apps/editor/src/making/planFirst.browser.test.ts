import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scriptAndTwoScenes } from "../testing/makingCalls.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const homes: RunningHome[] = [];

afterAll(async () => {
  await closeBrowser();
  await Promise.all(homes.map((home) => home.remove()));
});

const chatFileSchema = z.object({
  entries: z.array(z.looseObject({ kind: z.string() })),
});

async function requestTextsOf(folder: string): Promise<string[]> {
  const text = await readFile(
    join(folder, ".yumekit", "chat", "chat.json"),
    "utf8",
  ).catch(() => '{"entries":[]}');
  return chatFileSchema
    .parse(JSON.parse(text))
    .entries.flatMap((entry) =>
      entry.kind === "request" && typeof entry["text"] === "string"
        ? [
            [entry["text"], entry["details"]]
              .filter((part) => typeof part === "string")
              .join("\n"),
          ]
        : [],
    );
}

describe("the plan first", () => {
  it("stops after the pictures, waits for Continue, and finishes the video with the second answer", async () => {
    const home = await runHome({
      making: { calls: scriptAndTwoScenes, ending: "done" },
    });
    homes.push(home);
    const { page, close } = await openEditor(home.url);
    const folder = join(home.projectsFolder, "tea");
    const steps = () =>
      page
        .locator(".making-steps li")
        .evaluateAll((items) =>
          items.map((item) =>
            [item.getAttribute("data-status"), item.textContent].join(" "),
          ),
        );
    await page.getByLabel("What do you want to make?").fill("Tea");
    await page.getByRole("button", { name: "Product ad" }).click();
    await page.getByRole("switch", { name: "Show me the plan first" }).check();
    await page.getByRole("button", { name: "Make the video" }).click();
    await expect
      .poll(() =>
        page.getByRole("heading", { name: "Making your video" }).count(),
      )
      .toBe(1);
    const [firstRequest = ""] = await requestTextsOf(folder);

    expect(firstRequest.split("\n")[2]).toMatch(/^Format: Product ad\. /);
    expect(firstRequest.split("\n").at(-1)).toBe(
      "Stop after the script and the pictures of each scene, drawn by code. Make no voice, no music, and no paid clip yet. Ask me to continue.",
    );

    await home.finishRequest();

    await expect
      .poll(() =>
        page.getByRole("heading", { name: "The plan is ready" }).count(),
      )
      .toBe(1);
    expect(await steps()).toEqual([
      "done Write the scriptThe script is readyOpen now",
      "done Make the pictures2 pictures are readySee and change",
      "waiting Record the voiceWaits for Continue",
      "waiting Choose the musicWaits for Continue",
      "waiting Put it togetherWaits for Continue",
    ]);
    expect(
      await page
        .getByRole("textbox", { name: "The script of the video" })
        .getAttribute("contenteditable"),
    ).toBe("true");
    await page.getByRole("button", { name: /^Make the pictures/ }).click();
    await page.locator(".picture-card").first().click();
    expect(
      await page
        .locator(".picture-detail")
        .getByLabel("Heading", { exact: true })
        .isEnabled(),
    ).toBe(true);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect
      .poll(() =>
        page.getByRole("heading", { name: "Making your video" }).count(),
      )
      .toBe(1);
    expect((await requestTextsOf(folder)).at(-1)).toBe(
      "The plan is good. Use the script and the scenes as they are now, and make the rest of the video.",
    );
    expect((await steps()).slice(0, 3)).toEqual([
      "done Write the scriptThe script is readySee and change",
      "done Make the pictures2 pictures are readyOpen now",
      "now Record the voiceWorking",
    ]);

    await home.finishRest();

    await expect
      .poll(() =>
        page.getByRole("heading", { name: "Your video is ready" }).count(),
      )
      .toBe(1);
    expect((await steps()).at(-1)).toBe(
      "done Put it togetherThe video is readySee and change",
    );
    await close();
  });
});
