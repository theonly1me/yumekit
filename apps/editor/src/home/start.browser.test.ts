import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openProject } from "../testing/editorPage.js";
import { runHome, type RunningHome } from "../testing/runHome.js";
import { startTemplates } from "./templates.js";

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

const requestSchema = z.object({
  details: z.string(),
  files: z.array(z.object({ assetId: z.string(), name: z.string() })),
});

const chatSchema = z.object({
  entries: z.array(z.looseObject({ kind: z.string() })),
});

async function fileOf(options: {
  folder: string;
  name: string;
}): Promise<unknown> {
  const text = await readFile(join(options.folder, options.name), "utf8");
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

describe("the start screen", () => {
  it("starts for YouTube with the length open, puts a guide in the box from a template, and keeps Start off while the box is empty", async () => {
    const home = await startHome({ calls: [], ending: "done" });
    const { page, close } = await openProject(home.url);
    const start = page.getByRole("button", { name: "Start", exact: true });
    const box = page.getByLabel("What do you want to make?");

    await page.getByRole("button", { name: "A trailer" }).waitFor();
    expect(await start.isDisabled()).toBe(true);
    expect(
      await page
        .getByText("For YouTube. The lead asks about the length.")
        .count(),
    ).toBe(1);
    await page.getByRole("button", { name: "A movie" }).click();

    expect(await box.inputValue()).toBe(startTemplates[1]?.guide);
    expect(
      await box.evaluate((element) =>
        element instanceof HTMLTextAreaElement ? element.selectionStart : -1,
      ),
    ).toBe("A movie, about 8 minutes.\nThe story: ".length);
    expect(await start.isDisabled()).toBe(false);
    await page.getByRole("button", { name: "Change" }).click();
    await page.getByRole("button", { name: /^TikTok/ }).click();
    await page.getByRole("button", { name: "30 seconds" }).click();
    expect(
      await page.getByText("For YouTube and TikTok. About 30 seconds.").count(),
    ).toBe(1);
    await close();
  });

  it("sends the form of the template and the files of the box, and opens the project screen", async () => {
    const home = await startHome({ calls: [], ending: "done" });
    const { page, close } = await openProject(home.url);
    const picture = join(home.root, "bell.svg");
    await writeFile(
      picture,
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="18"/>',
    );
    await page.getByRole("button", { name: "A trailer" }).click();
    await page.keyboard.type("a bell for the island");
    await page.locator(".prompt-box input[type=file]").setInputFiles(picture);
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page
      .getByRole("heading", { name: "The lead reads your request" })
      .waitFor();
    const folder = join(home.projectsFolder, "a-bell-for-the-island");
    const chat = chatSchema.parse(
      await fileOf({ folder, name: ".yumekit/chat/chat.json" }),
    );
    const request = requestSchema.parse(
      chat.entries.find((entry) => entry.kind === "request"),
    );
    expect(request.details).toContain("Form: trailer.");
    expect(request.files).toEqual([{ assetId: "bell", name: "bell.svg" }]);
    expect(await fileOf({ folder, name: "project.json" })).toMatchObject({
      name: "A bell for the island",
      videoStyle: "ai-video",
    });
    expect(new URL(page.url()).port).not.toBe(new URL(home.url).port);
    await home.finishRequest();
    await close();
  });

  it("opens the project screen and says what to do when no AI program is on the computer", async () => {
    const home = await startHome("no-agent");
    const { page, close } = await openProject(home.url);
    await page.getByLabel("What do you want to make?").fill("Tea");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page
      .getByRole("heading", { name: "No AI is on this computer" })
      .waitFor();
    expect(new URL(page.url()).search).toBe("");
    await page.getByRole("button", { name: "Edit by hand" }).click();
    await expect
      .poll(() =>
        page.getByRole("button", { name: "Back to the project" }).count(),
      )
      .toBe(1);
    await close();
  });
});
