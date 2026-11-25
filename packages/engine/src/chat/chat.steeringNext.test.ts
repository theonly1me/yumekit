import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { startTestEngine } from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { chatFilePath } from "./chatFile.js";
import { init, result, whole } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";
import { firstTextOf, savedResultOf } from "./testing/savedResult.js";

const direction = "Use the second clip for the bridge shot.";

async function waitForRuns(options: {
  runs: () => Promise<string[][]>;
  count: number;
}): Promise<string[][]> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const runs = await options.runs().catch(() => []);
    if (runs.length >= options.count) return runs;
    await delay(50);
  }
  throw new Error("The AI program did not start again.");
}

describe("a message of the person that the AI has not read yet", () => {
  it("stops a paid call before it runs, and gives the AI the message in its place", async () => {
    const chat = await startChatEngine({ steps: [] });
    const folder = chat.project.root;
    await chat.writeScenario({
      steps: [
        { print: init },
        { waitForFile: join(folder, "sent") },
        {
          callTool: {
            name: "generate_asset",
            input: {
              asset_id: "bridge-clip",
              capability: "image",
              input: {
                prompt: "a bridge",
                width_pixels: 32,
                height_pixels: 18,
              },
            },
            saveResultTo: join(folder, "paid.json"),
          },
        },
        { print: result("completed") },
      ],
    });
    await chat.ask({ text: "Make the bridge shot." });
    await chat.ask({ text: direction });
    await writeFile(join(folder, "sent"), "");
    const { entries } = await chat.waitUntilIdle();

    const paid = await savedResultOf(join(folder, "paid.json"));
    expect(paid.isError).toBe(true);
    expect(paid.mcpResult.structuredContent).toMatchObject({
      kind: "person-message-waiting",
    });
    expect(firstTextOf(paid)).toContain(direction);
    const project = await rawRequest({
      port: chat.engine.port,
      path: "/api/project",
      headers: withToken(chat.engine),
    });
    expect(project.body).not.toContain("bridge-clip");
    expect(entries.find((entry) => entry.kind === "steering")).toMatchObject({
      state: "read",
    });
    expect(await chat.runs()).toHaveLength(1);
  });

  it("starts the next request with the message when the request ends before the AI reads it", async () => {
    const chat = await startChatEngine({ steps: [] });
    const folder = chat.project.root;
    await chat.writeScenario({
      steps: [
        { print: init },
        { waitForFile: join(folder, "sent") },
        { print: whole("Done.") },
        { print: result("completed") },
      ],
    });
    await chat.ask({ text: "Make the bridge shot." });
    await chat.ask({ text: direction });
    await writeFile(join(folder, "sent"), "");

    const runs = await waitForRuns({ runs: chat.runs, count: 2 });
    const { entries } = await chat.waitUntilIdle();
    expect(runs[1]?.at(-1)).toBe(direction);
    expect(entries.map((entry) => entry.kind)).toEqual([
      "request",
      "answer",
      "steering",
      "answer",
    ]);
    expect(entries[2]).toMatchObject({ state: "read" });
  });

  it("keeps the message on disk when the engine closes, and starts it as a request when the engine starts again", async () => {
    const chat = await startChatEngine({
      steps: [
        { print: init },
        { waitForStop: { print: [result("aborted_streaming")] } },
      ],
    });
    await chat.ask({ text: "Make the bridge shot." });
    await waitForRuns({ runs: chat.runs, count: 1 });
    await chat.ask({ text: direction });
    await chat.engine.close();

    const saved = await readFile(
      chatFilePath(chat.project.projectFolder),
      "utf8",
    );
    const savedChat: unknown = JSON.parse(saved);
    expect(savedChat).toMatchObject({
      entries: [
        { kind: "request" },
        { kind: "answer", state: "stopped" },
        { kind: "steering", text: direction, state: "waiting" },
      ],
    });
    expect(await chat.runs()).toHaveLength(1);

    await chat.writeScenario({
      steps: [
        { print: init },
        { print: whole("Done.") },
        { print: result("completed") },
      ],
    });
    await startTestEngine({
      projectFolder: chat.project.projectFolder,
      serverCommand: { command: "/bin/false", args: [] },
    });
    const runs = await waitForRuns({ runs: chat.runs, count: 2 });
    expect(runs[1]?.at(-1)).toBe(direction);
  });
});
