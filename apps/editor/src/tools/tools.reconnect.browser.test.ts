import type { Request, WebSocketRoute } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, sharedBrowser } from "../testing/editorPage.js";
import {
  engineRequest,
  keyTestServer,
  openTools,
  testKeyVariable,
  withoutOtherBundled,
} from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
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

describe("the event connection of the editor", () => {
  it("uses one WebSocket, and after a reconnect shows the media servers and the project as they are now", async () => {
    const context = await (
      await sharedBrowser()
    ).newContext({ viewport: { width: 1440, height: 900 } });
    context.setDefaultTimeout(15_000);
    const page = await context.newPage();
    const openSockets = new Set<WebSocketRoute>();
    let isBlocked = false;
    await page.routeWebSocket(/\/api\/events/, async (route) => {
      if (isBlocked) {
        await route.close();
        return;
      }
      openSockets.add(route);
      route.onClose(() => {
        openSockets.delete(route);
      });
      route.connectToServer();
    });
    let pendingServerLists = 0;
    const isServerList = (url: string) => url.endsWith("/api/media-servers");
    page.on("request", (request) => {
      if (isServerList(request.url())) pendingServerLists += 1;
    });
    const finishServerList = (request: Request) => {
      if (isServerList(request.url())) pendingServerLists -= 1;
    };
    page.on("requestfinished", finishServerList);
    page.on("requestfailed", finishServerList);
    await page.goto(`${runningEngine().url}#edit`);
    await openTools(page);
    const row = page.getByRole("button", { name: /Key test server/ });
    await expect.poll(() => row.textContent()).toContain("Needs a key");
    await expect.poll(() => pendingServerLists).toBe(0);
    expect(await row.textContent()).toContain("Needs a key");
    expect(openSockets.size).toBe(1);

    isBlocked = true;
    for (const socket of [...openSockets]) await socket.close();
    await engineRequest({
      engine: runningEngine(),
      path: `/api/keys/${testKeyVariable}`,
      method: "PUT",
      body: { value: "made-up-reconnect-key" },
    });
    await runningEngine().callTool({
      name: "add_output",
      input: {
        output_id: "square",
        label: "square",
        width_pixels: 200,
        height_pixels: 200,
      },
    });
    expect(await row.textContent()).toContain("Needs a key");
    isBlocked = false;

    await expect
      .poll(() => row.textContent())
      .toContain("Ready, key saved here");
    await expect
      .poll(() => page.locator('[role="tab"]', { hasText: "Square" }).count())
      .toBe(1);
    expect(openSockets.size).toBe(1);
    await context.close();
  });
});
