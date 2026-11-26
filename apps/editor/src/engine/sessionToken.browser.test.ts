import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, sharedBrowser } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const linkPage = "This page needs the link from yumekit open";

describe("the session token of the editor", () => {
  it("keeps the editor after a reload, and keeps the token out of the address, local storage, cookies, and the console", async () => {
    const { url, token } = runningEngine();
    const context = await (await sharedBrowser()).newContext();
    const page = await context.newPage();
    const consoleLines: string[] = [];
    page.on("console", (message) => consoleLines.push(message.text()));
    await page.goto(`${url}#edit`);
    await page.locator(".card", { hasText: "First counter" }).waitFor();

    await page.reload();

    await page.locator(".card", { hasText: "First counter" }).waitFor();
    expect(page.url()).not.toContain(token);
    const stored = await page.evaluate(() => ({
      local: Object.keys(window.localStorage)
        .map((key) => window.localStorage.getItem(key) ?? "")
        .join(" "),
      cookie: document.cookie,
    }));
    expect(stored.local).not.toContain(token);
    expect(stored.cookie).not.toContain(token);
    expect(consoleLines.filter((line) => line.includes(token))).toEqual([]);
    await context.close();
  });

  it("shows the page that asks for the link in a second tab with no token", async () => {
    const { url, origin } = runningEngine();
    const context = await (await sharedBrowser()).newContext();
    const first = await context.newPage();
    await first.goto(`${url}#edit`);
    await first.locator(".card", { hasText: "First counter" }).waitFor();

    const second = await context.newPage();
    await second.goto(`${origin}/`);

    await second.getByRole("heading", { name: linkPage }).waitFor();
    await context.close();
  });
});
