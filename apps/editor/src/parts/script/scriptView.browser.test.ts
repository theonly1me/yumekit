import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  openGate,
  requestTextsSent,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { holdEngineAnswers } from "../../testing/heldAnswers.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import {
  answerAfterGate,
  openStepSheet,
  readScript,
} from "../../testing/stepViews.js";

const updateTheVideoRequest =
  "I changed the script. Update the video to match the script.";
const firstScript = "# Tea\n\nTea is **calm** and *warm*.\n\n- Green\n- Black";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openScript() {
  await runningEngine().callTool({
    name: "set_script",
    input: { script: firstScript },
  });
  const editor = await openEditor(runningEngine().url);
  await openStepSheet({ page: editor.page, name: "Script" });
  const scriptPage = editor.page.getByRole("textbox", {
    name: "The script of the video",
  });
  await expect.poll(() => scriptPage.locator("h1").textContent()).toBe("Tea");
  return { ...editor, scriptPage };
}

function formatsOf(
  scriptPage: Awaited<ReturnType<typeof openScript>>["scriptPage"],
) {
  return scriptPage.evaluate((page) => ({
    heading: page.querySelector("h1")?.textContent,
    bold: page.querySelector("strong")?.textContent,
    italic: page.querySelector("em")?.textContent,
    items: [...page.querySelectorAll("li")].map((item) => item.textContent),
  }));
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the Script view", () => {
  it("shows formatted text, and keeps a heading, bold, italic, and a list through a save and a load", async () => {
    const { page, scriptPage, close } = await openScript();
    const formats = {
      heading: "Tea",
      bold: "calm",
      italic: "warm",
      items: ["Green", "Black"],
    };
    expect(await formatsOf(scriptPage)).toEqual(formats);

    await scriptPage.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Drink it hot.");

    await expect
      .poll(() => readScript(runningEngine()))
      .toContain("Drink it hot.");
    const saved = await readScript(runningEngine());
    expect(saved).toMatch(/^# Tea$/m);
    expect(saved).toContain("**calm**");
    expect(saved).toMatch(/[*_]warm[*_]/);
    expect(saved).toMatch(/^[-*] Green$/m);
    await page.getByRole("button", { name: "Close" }).click();
    await openStepSheet({ page, name: "Script" });
    await expect
      .poll(() => scriptPage.textContent())
      .toContain("Drink it hot.");
    expect(await formatsOf(scriptPage)).toEqual(formats);
    await close();
  });

  it("makes a selected word bold with the Bold button", async () => {
    const { page, scriptPage, close } = await openScript();

    await scriptPage.getByText("Black").dblclick();
    await page.getByRole("button", { name: "Bold" }).click();

    await expect
      .poll(() => readScript(runningEngine()))
      .toMatch(/^[-*] \*\*Black\*\*$/m);
    await close();
  });

  it("sends the fixed request with Update the video, the chat shows it, and the view is locked until the answer ends", async () => {
    await answerAfterGate(runningEngine());
    const { page, scriptPage, close } = await openScript();

    await scriptPage.locator("h1").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" time");
    await page.getByRole("button", { name: "Update the video" }).click();

    await expect
      .poll(() => chatOf(page).entryTexts(2))
      .toContain(`You\n${updateTheVideoRequest}`);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(updateTheVideoRequest);
    await expect
      .poll(() => page.getByRole("button", { name: "Bold" }).isDisabled())
      .toBe(true);
    expect(await scriptPage.getAttribute("contenteditable")).toBe("false");
    await openGate(runningEngine());
    await expect
      .poll(() => page.getByRole("button", { name: "Bold" }).isDisabled())
      .toBe(false);
    await close();
  });

  it("puts the script back with Undo my changes", async () => {
    const { page, scriptPage, close } = await openScript();

    await scriptPage.locator("li").last().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" tea");
    await expect.poll(() => readScript(runningEngine())).toContain("Black tea");
    await page.keyboard.type(" leaves");
    await expect
      .poll(() => readScript(runningEngine()))
      .toContain("Black tea leaves");
    await page.getByRole("button", { name: "Undo my changes" }).click();

    await expect.poll(() => readScript(runningEngine())).toBe(firstScript);
    await expect
      .poll(() => scriptPage.locator("li").last().textContent())
      .toBe("Black");
    await close();
  });

  it("puts the whole script back with Undo my changes while the answer to the last save is still on its way", async () => {
    const { page, scriptPage, close } = await openScript();
    const answers = await holdEngineAnswers(page);
    await scriptPage.locator("li").last().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" tea");
    await expect
      .poll(() => {
        const [firstSave] = answers.savedRevisions();
        return firstSave !== undefined && answers.shownRevision() >= firstSave;
      })
      .toBe(true);

    answers.hold();
    await page.keyboard.type(" leaves");
    await expect.poll(() => answers.savedRevisions().length).toBe(2);
    await page.getByRole("button", { name: "Undo my changes" }).click();
    answers.release();

    await expect.poll(() => readScript(runningEngine())).toBe(firstScript);
    await close();
  });
});
