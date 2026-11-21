import { request } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it, onTestFinished } from "vitest";
import { startedTestEngine } from "./testing/engineFixture.js";
import { callTool, previewOriginOf, titleScene } from "./testing/rawRequest.js";

function followPreviewEvents(previewOrigin: string): string[] {
  const received: string[] = [];
  const url = new URL("/preview-events", previewOrigin);
  const sent = request(url, (response) => {
    response.on("data", (chunk: Buffer) => received.push(chunk.toString()));
  });
  sent.on("error", () => undefined);
  sent.end();
  onTestFinished(() => {
    sent.destroy();
  });
  return received;
}

async function waitForText(options: {
  received: string[];
  text: string;
}): Promise<boolean> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (options.received.join("").includes(options.text)) return true;
    await delay(20);
  }
  return false;
}

describe("the preview of the engine", () => {
  it("refreshes the preview page after each project change", async () => {
    const { engine } = await startedTestEngine();
    const received = followPreviewEvents(await previewOriginOf(engine));
    await delay(200);

    const before = received.join("");
    await callTool({ ...engine, name: "put_scene", input: titleScene });
    const firstRefresh = await waitForText({ received, text: "data: 1\n\n" });
    await callTool({ ...engine, name: "set_script", input: { script: "x" } });
    const secondRefresh = await waitForText({ received, text: "data: 2\n\n" });

    expect(before).not.toContain("data:");
    expect(firstRefresh).toBe(true);
    expect(secondRefresh).toBe(true);
  });

  it("serves the new scene in the preview data after a change", async () => {
    const { engine } = await startedTestEngine();
    const previewOrigin = await previewOriginOf(engine);
    const previewData = () =>
      fetch(`${previewOrigin}/preview-data?output=wide`).then((response) =>
        response.text(),
      );

    const before = await previewData();
    await callTool({ ...engine, name: "put_scene", input: titleScene });
    const after = await previewData();

    expect(before).not.toContain("The lake");
    expect(after).toContain("The lake");
  });
});
