import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openPicturesTake, readyTake } from "../../testing/takeProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

function watchSignals(): void {
  const signals = { notices: [""], tones: 0, asks: 0 };
  signals.notices = [];
  Object.assign(window, { signals });
  const fakeNotice = Object.assign(
    function notice(...[title, options]: [string, { body: string }]) {
      signals.notices.push(`${title}: ${options.body}`);
    },
    {
      permission: "default",
      requestPermission: () => {
        signals.asks += 1;
        fakeNotice.permission = "granted";
        return Promise.resolve("granted");
      },
    },
  );
  class CountedSound extends AudioContext {
    override createOscillator() {
      signals.tones += 1;
      return super.createOscillator();
    }
  }
  Object.assign(window, {
    Notification: fakeNotice,
    AudioContext: CountedSound,
  });
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the ready signal", () => {
  it("asks for notices on the first click, then rings, notices, counts in the title, and opens the take from the chat", async () => {
    const { page, close } = await openProject(runningEngine().url);
    await page.addInitScript(watchSignals);
    await page.reload();
    const signals = () =>
      page.evaluate(() => {
        const watched: unknown = Reflect.get(window, "signals");
        return watched;
      });

    await page.getByRole("main").click();
    await openPicturesTake({ engine: runningEngine(), assetIds: ["ferry"] });
    await readyTake({ engine: runningEngine(), items: [{ id: "ferry" }] });

    await expect.poll(() => page.title()).toBe("(1) Editor test");
    expect(await signals()).toEqual({
      notices: ["yumekit: Take 1 is ready for you"],
      tones: 2,
      asks: 1,
    });
    const line = page.locator(".take-ready");
    expect(await line.locator("p").innerText()).toBe(
      "Take 1 is ready for you: 1 picture to check.",
    );
    await page.getByRole("button", { name: "Edit by hand" }).click();
    await page.getByRole("button", { name: "Open take 1" }).click();
    await page.getByRole("dialog", { name: "Takes" }).waitFor();
    expect(
      await page
        .getByRole("dialog", { name: "Takes" })
        .locator(".slate")
        .innerText(),
    ).toContain("1");
    await close();
  });
});
