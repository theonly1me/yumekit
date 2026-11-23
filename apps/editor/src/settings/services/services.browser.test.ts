import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import {
  engineRequest,
  keyTestServer,
  openTools,
  testKeyVariable,
  withoutOtherBundled,
} from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

const madeUpKey = "made-up-services-key-3c81d7a0";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function userDefaults(): Promise<unknown> {
  const folder = runningEngine().environment["YUMEKIT_CONFIG_DIRECTORY"] ?? "";
  const text = await readFile(join(folder, "media-tools.json"), "utf8");
  const parsed: unknown = JSON.parse(text);
  return typeof parsed === "object" && parsed !== null
    ? Reflect.get(parsed, "defaults")
    : undefined;
}

beforeAll(async () => {
  engine = await runEngine({
    withChromium: true,
    mediaTools: {
      mcpServers: {
        sample: {},
        keytest: keyTestServer,
        ...withoutOtherBundled,
      },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the Services group of Settings", () => {
  it("shows one row for each kind with the service and the model that apply now", async () => {
    const editor = await openEditor(runningEngine().url);
    await openTools(editor.page);

    const rows = editor.page
      .getByRole("list", { name: "Services" })
      .getByRole("listitem");

    await expect
      .poll(() => rows.allTextContents())
      .toEqual([
        expect.stringMatching(
          /^Pictures.*Sample \(free test server\), Prompt as text on a plain color/,
        ),
        expect.stringMatching(/^Voice.*Quiet tone with even word timings/),
        expect.stringMatching(/^Music.*Low tone/),
        expect.stringMatching(/^Video clips.*Plain color with a frame counter/),
        expect.stringMatching(/^Sounds.*Short high tone/),
        expect.stringMatching(
          /^Talking clips.*Your picture or video with the voice/,
        ),
        expect.stringMatching(/^Sharper copy.*Plain larger copy/),
      ]);
    await editor.close();
  });

  it("opens the key guide for a model of a service with no key, and saves the pick after the key saves", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    await page.getByRole("button", { name: "Change Video clips" }).click();
    const list = page.getByRole("group", { name: "Models for Video clips" });
    await list.getByRole("button", { name: "Test video model" }).click();
    await list.getByLabel("Test key").fill(madeUpKey);
    await list.getByRole("button", { name: "Save the key" }).click();

    const row = page
      .getByRole("list", { name: "Services" })
      .getByRole("listitem")
      .filter({ hasText: "Video clips" })
      .first();
    await expect
      .poll(() => row.textContent())
      .toContain("Key test server, Test video model");
    await expect.poll(userDefaults).toEqual({
      video: { server: "keytest", model: "test-video" },
    });
    await engineRequest({
      engine: runningEngine(),
      path: `/api/keys/${testKeyVariable}`,
      method: "DELETE",
    });
    await editor.close();
  });

  it("saves a pick of a ready model in one click, and removes it again", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    await page.getByRole("button", { name: "Change Pictures" }).click();
    const list = page.getByRole("group", { name: "Models for Pictures" });
    await list
      .getByRole("button", { name: "Prompt as text on a plain color" })
      .click();
    await expect
      .poll(() => userDefaults())
      .toMatchObject({ image: { server: "sample", model: "sample-image" } });

    await list.getByRole("button", { name: /Let yumekit pick/ }).click();

    await expect
      .poll(() => userDefaults())
      .toEqual({ video: { server: "keytest", model: "test-video" } });
    await editor.close();
  });
});
