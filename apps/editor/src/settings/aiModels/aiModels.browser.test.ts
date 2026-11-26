import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { readSettings } from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { openMoreSettings } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const savedSchema = z.object({
  models: z.object({
    "claude-code": z.object({ lead: z.record(z.string(), z.string()) }),
  }),
});

async function leadChoiceOf(engine: RunningEngine) {
  const saved = savedSchema.safeParse(await readSettings(engine));
  return saved.success ? saved.data.models["claude-code"].lead : undefined;
}

async function openAiSettings() {
  const editor = await openEditor(runningEngine().url);
  await editor.page.locator(".agent-line").click();
  const settings = editor.page.getByRole("dialog", { name: "Settings" });
  const choices = settings.getByRole("list", {
    name: "The model and effort of the AI",
    exact: true,
  });
  return { editor, settings, choices };
}

describe("the model and the effort in Settings", () => {
  it("names the two AIs in plain words and saves the model and the effort of each one", async () => {
    const { editor, choices } = await openAiSettings();
    const page = editor.page;

    await expect.poll(() => choices.getByRole("listitem").count()).toBe(1);
    await openMoreSettings(page);
    const checkerChoices = page.getByRole("list", {
      name: "The model and effort of the AI that checks the work",
    });
    await expect
      .poll(() => checkerChoices.getByRole("listitem").count())
      .toBe(1);
    const rows = [
      ...(await choices.locator(".setting-name").allInnerTexts()),
      ...(await checkerChoices.locator(".setting-name").allInnerTexts()),
    ];
    expect(rows).toEqual([
      "The AI that makes the film\nIt writes the story, plans the shots, and builds the video.",
      "The AI that checks the work\nIt looks at each picture and clip, and says what to keep and what to make again.",
    ]);
    const leadModel = page.getByLabel("The AI that makes the film: model");
    await expect
      .poll(() => leadModel.getAttribute("placeholder"))
      .toBe("Claude Code picks");
    await leadModel.fill("sonnet");
    await leadModel.press("Enter");
    await page
      .getByLabel("The AI that makes the film: effort")
      .selectOption("low");
    await page
      .getByLabel("The AI that checks the work: effort")
      .selectOption({ label: "Max: slowest and most careful" });

    await expect
      .poll(() => readSettings(runningEngine()))
      .toMatchObject({
        models: {
          "claude-code": {
            lead: { model: "sonnet", effort: "low" },
            critic: { effort: "max" },
          },
        },
      });
    await editor.close();
  });

  it("keeps the choice after a reload, and an empty model lets the program pick again", async () => {
    const { editor } = await openAiSettings();
    const leadModel = editor.page.getByLabel(
      "The AI that makes the film: model",
    );

    await expect.poll(() => leadModel.inputValue()).toBe("sonnet");
    await leadModel.fill("");
    await leadModel.press("Enter");

    await expect
      .poll(() => leadChoiceOf(runningEngine()))
      .toEqual({
        effort: "low",
      });
    await editor.close();
  });
});
