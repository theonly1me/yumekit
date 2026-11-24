import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { buildFilesProject } from "../../testing/filesProject.js";
import { engineRequest } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withVoiceServer: true });
  await buildFilesProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const projectSchema = z.object({
  project: z.object({
    lookFont: z.string().optional(),
    fonts: z.array(z.unknown()).optional(),
  }),
});

async function projectFonts() {
  const { project } = projectSchema.parse(
    await engineRequest({ engine: runningEngine(), path: "/api/project" }),
  );
  return { lookFont: project.lookFont, fonts: project.fonts };
}

describe("a font file in the files view", () => {
  it("adds a font file, lists it under Fonts, and sets it as the font of the video in one change", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Files" });

    await page.locator(".file-drop input[type=file]").setInputFiles({
      name: "Geist-Variable.woff2",
      mimeType: "font/woff2",
      buffer: Buffer.from("wOF2 font bytes"),
    });
    const fonts = page.getByRole("list", { name: "Fonts", exact: true });
    await expect
      .poll(() => fonts.locator(".file-text").allInnerTexts())
      .toEqual(["Geist-Variable.woff2\nFont · Your file\nNot in the video"]);
    await page
      .getByRole("button", {
        name: "Use Geist-Variable.woff2 as the font of the video",
      })
      .click();

    await expect.poll(projectFonts).toEqual({
      lookFont: "Geist",
      fonts: [
        { assetId: "geist-variable", family: "Geist", weight: [100, 900] },
      ],
    });
    await expect
      .poll(() => fonts.locator(".file-text").allInnerTexts())
      .toEqual([
        "Geist-Variable.woff2\nFont · Your file\nIn the video: The text of the video",
      ]);
    await close();
  });
});
