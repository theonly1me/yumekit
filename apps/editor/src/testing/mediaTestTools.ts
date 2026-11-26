import { fileURLToPath } from "node:url";
import type { Page } from "playwright";
import { z } from "zod";
import type { RunningEngine } from "./runEngine.js";

export const testKeyVariable = "YUMEKIT_EDITOR_TEST_KEY";

export const keyTestServer = {
  command: process.execPath,
  args: [fileURLToPath(new URL("./keyTestServer.ts", import.meta.url))],
  passEnvironment: [testKeyVariable],
};

export const plainKeyTestServer = {
  ...keyTestServer,
  args: [...keyTestServer.args, "--without-check-key"],
};

export const noPictureKeyTestServer = {
  ...keyTestServer,
  args: [...keyTestServer.args, "--accepts-no-picture"],
};

export const voiceTestServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../../packages/tools/src/testing/voiceMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
};

export const withoutOtherBundled = {
  openai: { disabled: true },
  gemini: { disabled: true },
  fal: { disabled: true },
  "local-voice": { disabled: true },
  "local-music": { disabled: true },
  codex: { disabled: true },
};

export async function engineRequest(options: {
  engine: RunningEngine;
  path: string;
  method?: string;
  body?: object;
}): Promise<unknown> {
  const response = await fetch(`${options.engine.origin}${options.path}`, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${options.engine.token}`,
      "content-type": "application/json",
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  return response.json();
}

const assetsSchema = z.object({
  assets: z.array(z.object({ id: z.string(), kind: z.string() })),
});

export async function videoAssetCount(engine: RunningEngine): Promise<number> {
  const { assets } = assetsSchema.parse(
    await engineRequest({ engine, path: "/api/project" }),
  );
  return assets.filter((asset) => asset.kind === "video").length;
}

const timelinesSchema = z.object({
  timelines: z.array(
    z.object({
      outputId: z.string(),
      tracks: z.array(
        z.object({
          kind: z.string(),
          clips: z.array(
            z.object({
              id: z.string(),
              sceneId: z.string().optional(),
              startFrame: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export async function sceneClipsOf(options: {
  engine: RunningEngine;
  outputId: string;
}) {
  const { timelines } = timelinesSchema.parse(
    await engineRequest({ engine: options.engine, path: "/api/project" }),
  );
  return timelines
    .filter((timeline) => timeline.outputId === options.outputId)
    .flatMap((timeline) => timeline.tracks)
    .filter((track) => track.kind === "scene")
    .flatMap((track) => track.clips);
}

export async function openMoreSettings(page: Page): Promise<void> {
  await page
    .getByRole("dialog", { name: "Settings" })
    .locator("summary", { hasText: "More settings" })
    .click();
}

export async function openTools(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("dialog", { name: "Settings" }).waitFor();
  await openMoreSettings(page);
}

export async function openMakeClip(page: Page): Promise<void> {
  await page.locator(".card").first().click();
  await page
    .getByRole("group", { name: /^Actions for scene/ })
    .getByRole("button", { name: "Make a real video clip" })
    .click();
  await page.getByRole("dialog", { name: "Make a real video clip" }).waitFor();
}

export async function generateStill(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "first-still",
      capability: "image",
      server: "sample",
      input: { prompt: "A red ball", width_pixels: 320, height_pixels: 180 },
    },
  });
}
