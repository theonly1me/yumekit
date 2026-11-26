import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatOf, claudeLines, setScenario } from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import {
  closeBrowser,
  openEditor,
  sharedBrowser,
} from "../testing/editorPage.js";
import {
  layoutOf,
  longRequestText,
  sendOverHttp,
} from "../testing/longRequest.js";
import {
  fitsTheWindow,
  openPhonePage,
  pageWidthOf,
} from "../testing/pageWidth.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const boxShareOfThePane = 0.4;
const foldedLineCount = 8;

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("Done.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a very long request", () => {
  it("grows the box up to 40 percent of the chat, then scrolls inside the box", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.box.fill(longRequestText);

    const layout = await layoutOf(editor.page);
    const highestBox = layout.chatPaneHeight * boxShareOfThePane;
    expect(layout.boxHeight).toBeGreaterThan(highestBox - 2);
    expect(layout.boxHeight).toBeLessThanOrEqual(highestBox + 1);
    expect(layout.boxScrolls).toBe(true);
    expect(layout.sendBottom).toBeLessThanOrEqual(layout.windowHeight);
    expect(layout.pageHeight).toBe(layout.windowHeight);
    await editor.close();
  });

  it("shows a request from the HTTP route folded, with Show all and Show less, and keeps the page in the window", async () => {
    await sendOverHttp({ engine: runningEngine(), text: longRequestText });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await expect.poll(() => chat.entryTexts(1)).toEqual(["AI\nDone."]);
    const request = chat.history.locator(".entry.you").last();
    const text = request.locator(".request-text p");
    const showAll = request.getByRole("button", { name: "Show all" });

    const foldedHeight = await text.evaluate((element) => {
      const lineHeight = Number.parseFloat(
        getComputedStyle(element).lineHeight,
      );
      return element.clientHeight / lineHeight;
    });
    expect(Math.round(foldedHeight)).toBe(foldedLineCount);
    expect(await showAll.getAttribute("aria-expanded")).toBe("false");
    const folded = await layoutOf(editor.page);
    expect(folded.pageHeight).toBe(folded.windowHeight);

    await showAll.focus();
    await editor.page.keyboard.press("Enter");

    const showLess = request.getByRole("button", { name: "Show less" });
    expect(await showLess.getAttribute("aria-expanded")).toBe("true");
    expect(
      await text.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
    const opened = await layoutOf(editor.page);
    expect(opened.pageHeight).toBe(opened.windowHeight);
    expect(opened.chatPaneHeight).toBe(folded.chatPaneHeight);
    expect(opened.sendBottom).toBeLessThanOrEqual(opened.windowHeight);

    await showLess.click();
    await expect.poll(() => showAll.count()).toBe(1);
    await editor.close();
  });

  it("keeps the chat, the box, and Send inside the window of a phone", async () => {
    const { page, close } = await openPhonePage({
      browser: await sharedBrowser(),
      url: `${runningEngine().url}#edit`,
    });
    await page.getByRole("button", { name: "Ask for a change" }).click();
    const chat = chatOf(page);

    await chat.box.fill(longRequestText);

    const layout = await layoutOf(page);
    expect(layout.boxHeight).toBeLessThanOrEqual(
      layout.chatPaneHeight * boxShareOfThePane + 1,
    );
    expect(layout.sendBottom).toBeLessThanOrEqual(layout.windowHeight);
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);
    await close();
  });
});
