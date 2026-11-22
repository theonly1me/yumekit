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

async function startHome(making: Parameters<typeof runHome>[0]["making"]) {
  const home = await runHome({ making });
  homes.push(home);
  return home;
}

describe("the start screen", () => {
  it("starts with YouTube, TikTok, and 30 seconds, and keeps the button off while the prompt is empty", async () => {
    const home = await startHome({ calls: [], ending: "done" });
    const { page, close } = await openEditor(home.url);
    const button = page.getByRole("button", { name: "Make the video" });

    await expect
      .poll(() => page.getByText("What do you want to make?").count())
      .toBe(1);
    const pressed = await page
      .locator('[aria-pressed="true"]')
      .allTextContents();

    expect(pressed).toEqual([
      "YouTube16:9, 1920 x 1080",
      "TikTok9:16, 1080 x 1920",
      "GraphicsEach scene is drawn by code. It is exact, and it costs nothing.",
      "30 seconds",
    ]);
    expect(await button.isDisabled()).toBe(true);
    await expect
      .poll(() =>
        page
          .getByText("The AI is Claude Code on this computer. No key needed.")
          .count(),
      )
      .toBe(1);
    await page.getByLabel("What do you want to make?").fill("Tea");
    expect(await button.isDisabled()).toBe(false);
    await close();
  });

  it("makes the project with the choices, opens the editor of the new project, and lists it as recent", async () => {
    const home = await startHome({
      calls: scriptAndTwoScenes,
      ending: "done",
    });
    const { page, close } = await openEditor(home.url);
    await page
      .getByLabel("What do you want to make?")
      .fill("Two scenes about tea.");
    await page.getByRole("button", { name: /^TikTok/ }).click();
    await page.getByRole("button", { name: /^Instagram post/ }).click();
    await page.getByRole("button", { name: "15 seconds" }).click();
    await page.getByRole("button", { name: "Make the video" }).click();

    await expect
      .poll(() =>
        page.getByRole("heading", { name: "Making your video" }).count(),
      )
      .toBe(1);
    const project = z
      .object({ outputs: z.array(z.object({ id: z.string() })) })
      .parse(
        JSON.parse(
          await readFile(
            join(home.projectsFolder, "two-scenes-about-tea", "project.json"),
            "utf8",
          ),
        ),
      );
    expect(new URL(page.url()).port).not.toBe(new URL(home.url).port);
    expect(new URL(page.url()).search).toBe("");
    expect(project.outputs.map((output) => output.id)).toEqual([
      "wide",
      "portrait",
    ]);
    await home.finishRequest();
    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);

    const again = await openEditor(home.url);
    await again.page
      .getByRole("button", { name: /^Two scenes about tea/ })
      .click();
    await expect
      .poll(() => again.page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    expect(again.page.url()).toBe(page.url());
    await again.close();
    await close();
  });

  it("makes an AI video project, and shows the limit of AI video before the project exists", async () => {
    const home = await startHome("no-agent");
    const { page, close } = await openEditor(home.url);
    const limitLine =
      "yumekit makes at most 30 seconds of AI video for this project. You can change this in Settings.";
    await page.getByLabel("What do you want to make?").fill("Waves");
    expect(await page.getByText(limitLine).count()).toBe(0);

    await page.getByRole("button", { name: /^AI video/ }).click();
    await expect.poll(() => page.getByText(limitLine).count()).toBe(1);
    await page.getByRole("button", { name: "Make the video" }).click();

    await expect
      .poll(() =>
        readFile(join(home.projectsFolder, "waves", "project.json"), "utf8")
          .then((text) =>
            z.object({ videoStyle: z.string() }).parse(JSON.parse(text)),
          )
          .then(
            (project) => project.videoStyle,
            () => undefined,
          ),
      )
      .toBe("ai-video");
    await close();
  });

  it("opens the project and says what to do when no AI program is on the computer", async () => {
    const home = await startHome("no-agent");
    const { page, close } = await openEditor(home.url);
    await page.getByLabel("What do you want to make?").fill("Tea");
    await page.getByRole("button", { name: "Make the video" }).click();

    await expect
      .poll(() =>
        page
          .getByRole("heading", { name: "No AI is on this computer" })
          .count(),
      )
      .toBe(1);
    expect(new URL(page.url()).search).toBe("");
    await page.getByRole("button", { name: "Open the editor" }).click();
    await expect
      .poll(() => page.getByRole("button", { name: "Export" }).count())
      .toBe(1);
    await close();
  });
});
