import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { eventsUrlOf, upgradeStatusOf } from "../testing/eventsClient.js";
import { previewOriginOf, withToken } from "../testing/rawRequest.js";

describe("the request checks of the event WebSocket", () => {
  it("accepts a WebSocket with the token, the engine Host, and the engine origin", async () => {
    const { engine } = await startedTestEngine();

    const status = await upgradeStatusOf({
      url: eventsUrlOf(engine),
      headers: { origin: engine.origin },
    });

    expect(status).toBe(101);
  });

  it("rejects with 401 a WebSocket with no token, a wrong token, or the token only in a header", async () => {
    const { engine } = await startedTestEngine();
    const base = `ws://127.0.0.1:${String(engine.port)}/api/events`;

    const statuses = await Promise.all([
      upgradeStatusOf({ url: base }),
      upgradeStatusOf({ url: `${base}?token=${"f".repeat(64)}` }),
      upgradeStatusOf({ url: `${base}?token=` }),
      upgradeStatusOf({ url: base, headers: withToken(engine) }),
    ]);

    expect(statuses).toEqual([401, 401, 401, 401]);
  });

  it("rejects with 403 a WebSocket with the token and a Host header that is not the engine", async () => {
    const { engine } = await startedTestEngine();

    const statuses = await Promise.all(
      ["evil.example", `evil.example:${String(engine.port)}`].map((host) =>
        upgradeStatusOf({ url: eventsUrlOf(engine), headers: { host } }),
      ),
    );

    expect(statuses).toEqual([403, 403]);
  });

  it("rejects with 403 a WebSocket with the token from a foreign origin or from the preview page origin", async () => {
    const { engine } = await startedTestEngine();
    const previewOrigin = await previewOriginOf(engine);

    const statuses = await Promise.all(
      ["https://evil.example", "null", previewOrigin].map((origin) =>
        upgradeStatusOf({ url: eventsUrlOf(engine), headers: { origin } }),
      ),
    );

    expect(statuses).toEqual([403, 403, 403]);
  });

  it("rejects a WebSocket on another path with 404", async () => {
    const { engine } = await startedTestEngine();

    const status = await upgradeStatusOf({
      url: `ws://127.0.0.1:${String(engine.port)}/api/other?token=${engine.token}`,
    });

    expect(status).toBe(404);
  });
});
