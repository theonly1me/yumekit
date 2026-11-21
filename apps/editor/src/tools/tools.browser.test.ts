import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  engineRequest,
  keyTestServer,
  openTools,
  plainKeyTestServer,
  testKeyVariable,
  withoutOtherBundled,
} from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const madeUpKey = "made-up-editor-key-5f2e91c4";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
    withChromium: true,
    mediaTools: {
      mcpServers: {
        sample: {},
        keytest: keyTestServer,
        keyplain: plainKeyTestServer,
        ...withoutOtherBundled,
      },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the Tools tab", () => {
  it("lists each media server with what it makes, where it runs, and its state", async () => {
    const editor = await openEditor(runningEngine().url);
    await openTools(editor.page);

    const list = editor.page.getByRole("list", { name: "Media tools" });
    await expect.poll(() => list.getByRole("listitem").count()).toBe(3);
    const sample = list.getByRole("button", { name: /Sample/ });
    const keyTest = list.getByRole("button", { name: /Key test server/ });
    expect(await sample.textContent()).toContain("Ready, no key needed");
    expect(await sample.textContent()).toContain("On this computer");
    expect(await keyTest.textContent()).toContain("Video. Hosted");
    expect(await keyTest.textContent()).toContain("Needs a key");
    await editor.close();
  });

  it("shows the key steps of a server with no key, and a link that opens the key page in a new tab", async () => {
    const editor = await openEditor(runningEngine().url);
    await openTools(editor.page);

    await editor.page.getByRole("button", { name: /Key test server/ }).click();

    await expect
      .poll(() =>
        editor.page.getByText("Open the key page and sign in.").count(),
      )
      .toBe(1);
    const link = editor.page.getByRole("link", { name: "Open example.com" });
    expect(await link.getAttribute("href")).toBe("https://example.com/keys");
    expect(await link.getAttribute("target")).toBe("_blank");
    expect(await link.getAttribute("rel")).toBe("noopener noreferrer");
    const field = editor.page.getByLabel("Test key");
    expect(await field.getAttribute("type")).toBe("password");
    expect(await field.getAttribute("autocomplete")).toBe("off");
    await editor.close();
  });

  it("saves a key, tests it, and removes it, and the value is in no response, address, storage, or page text", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    const seen: string[] = [];
    const bodies: Promise<string>[] = [];
    page.on("request", (request) => {
      seen.push(request.url());
    });
    page.on("response", (response) => {
      seen.push(response.url());
      if (response.url().includes("/preview-events")) return;
      bodies.push(response.text().catch(() => ""));
    });
    await openTools(page);
    const row = page.getByRole("button", { name: /Key test server/ });
    await row.click();

    await page.getByLabel("Test key").fill(madeUpKey);
    await page.getByRole("button", { name: "Save the key" }).click();

    await expect
      .poll(() => row.textContent())
      .toContain("Ready, key saved here");
    expect(await page.getByLabel("Test key").count()).toBe(0);
    seen.push(page.url());
    seen.push(
      await page.evaluate(() =>
        Object.keys(localStorage)
          .map((name) => `${name}=${localStorage.getItem(name) ?? ""}`)
          .join(),
      ),
    );
    seen.push(await page.evaluate(() => document.documentElement.outerHTML));
    seen.push(await page.evaluate(() => document.body.innerText));
    seen.push(
      await page.evaluate(() =>
        [...document.querySelectorAll("input")]
          .map((input) => input.value)
          .join(),
      ),
    );
    seen.push(...(await Promise.all(bodies)));
    expect(seen.filter((text) => text.includes(madeUpKey))).toEqual([]);

    await page.getByRole("button", { name: "Test the key" }).click();
    await expect
      .poll(() => page.getByText("The server got the key.").count())
      .toBe(1);
    expect(await page.getByText("The key works.").count()).toBe(1);

    await page.getByRole("button", { name: "Remove the key" }).click();
    await expect.poll(() => row.textContent()).toContain("Needs a key");
    expect(await page.getByText("Open the key page and sign in.").count()).toBe(
      1,
    );
    await editor.close();
  });

  it("shows no Test button for a server without the check_key tool", async () => {
    const keyPath = `/api/keys/${testKeyVariable}`;
    await engineRequest({
      engine: runningEngine(),
      path: keyPath,
      method: "PUT",
      body: { value: madeUpKey },
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    await page.getByRole("button", { name: /Plain key test server/ }).click();

    await page.getByRole("button", { name: "Remove the key" }).waitFor();
    expect(
      await page.getByRole("button", { name: "Test the key" }).count(),
    ).toBe(0);
    await page.getByRole("button", { name: /^Key test server/ }).click();
    await page.getByRole("button", { name: "Test the key" }).waitFor();
    await engineRequest({
      engine: runningEngine(),
      path: keyPath,
      method: "DELETE",
    });
    await editor.close();
  });

  it("shows the stills of the scenes row while the Tools tab is open", async () => {
    await buildCounterProject(runningEngine());
    const editor = await openEditor(runningEngine().url);
    await openTools(editor.page);

    const stills = editor.page.locator(".panel-frame img");

    await expect.poll(() => stills.count()).toBe(2);
    expect(
      await stills.evaluateAll((images) =>
        images.map((image) =>
          image instanceof HTMLImageElement ? image.naturalWidth : 0,
        ),
      ),
    ).toEqual([320, 320]);
    await editor.close();
  });
});
