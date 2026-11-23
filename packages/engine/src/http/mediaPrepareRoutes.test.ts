import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { openEvents } from "../testing/eventsClient.js";
import { bodyOf, rawRequest, withToken } from "../testing/rawRequest.js";

const downloadServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../tools/src/testing/downloadMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
};

async function prepareEngine() {
  const { engine } = await startedTestEngine({
    userMediaTools: {
      mcpServers: {
        voice: downloadServer,
        openai: { disabled: true },
        gemini: { disabled: true },
        fal: { disabled: true },
        "local-voice": { disabled: true },
        "local-music": { disabled: true },
      },
    },
  });
  const events = await openEvents(engine);
  const prepare = (body: object) =>
    rawRequest({
      port: engine.port,
      path: "/api/media/prepare",
      method: "POST",
      headers: withToken({
        token: engine.token,
        headers: { "content-type": "application/json" },
      }),
      body: JSON.stringify(body),
    });
  return { engine, events, prepare };
}

describe("the prepare request of a model that downloads once", () => {
  it("sends the download line as call progress, then the new state of the choices", async () => {
    const { events, prepare } = await prepareEngine();

    const prepared = await prepare({ server: "voice", callId: "get-1" });

    expect(prepared.status).toBe(200);
    expect(bodyOf(prepared)).toEqual({ ready: true });
    const progress = await events.waitFor(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        Reflect.get(message, "type") === "call-progress",
    );
    expect(progress).toEqual({
      type: "call-progress",
      callId: "get-1",
      done: 2_000_000,
      total: 2_000_000,
      message: "Getting the test voice, one time, 2 MB",
    });
    await events.waitFor(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        Reflect.get(message, "type") === "media-servers-changed",
    );
  });

  it("refuses a server with nothing to download", async () => {
    const { prepare } = await prepareEngine();

    const refused = await prepare({ server: "sample" });

    expect(refused.status).toBe(400);
    expect(bodyOf(refused)).toMatchObject({ kind: "nothing-to-prepare" });
  });
});
