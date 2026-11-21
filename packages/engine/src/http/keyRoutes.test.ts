import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { isEventOfType, openEvents } from "../testing/eventsClient.js";
import {
  bodyOf,
  callTool,
  rawRequest,
  withToken,
  type RawResponse,
} from "../testing/rawRequest.js";

const keyValue = "made-up-engine-test-key-73c9a1";

const checkingServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../testing/checkingMediaServer.ts", import.meta.url),
    ),
  ],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
};

function captureOutput(): string[] {
  const lines: string[] = [];
  const capture = (chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  };
  vi.spyOn(process.stdout, "write").mockImplementation(capture);
  vi.spyOn(process.stderr, "write").mockImplementation(capture);
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation((...parts: unknown[]) => {
      lines.push(parts.map(String).join(" "));
    });
  }
  return lines;
}

describe("the key interface of the engine", () => {
  it("saves a key that reaches the media server, and no response, event, or log line holds the value", async () => {
    const output = captureOutput();
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools: { mcpServers: { checking: checkingServer } },
    });
    const events = await openEvents(engine);
    const keyRequest = (options: { method: string; body?: string }) =>
      rawRequest({
        port: engine.port,
        path: "/api/keys/YUMEKIT_TEST_KEY",
        headers: withToken(engine),
        ...options,
      });
    const check = () =>
      rawRequest({
        port: engine.port,
        path: "/api/keys/checking/check",
        method: "POST",
        headers: withToken(engine),
      });
    const servers = () =>
      rawRequest({
        port: engine.port,
        path: "/api/media-servers",
        headers: withToken(engine),
      });

    const answers: RawResponse[] = [await servers(), await check()];
    const saved = await keyRequest({
      method: "PUT",
      body: JSON.stringify({ value: keyValue }),
    });
    answers.push(saved, await check(), await servers());
    const control = await callTool({
      ...engine,
      name: "generate_asset",
      input: {
        asset_id: "control",
        capability: "speech",
        server: "checking",
        input: { text: "print the key" },
      },
    });
    answers.push(
      await keyRequest({ method: "PUT", body: `{"value": "${keyValue}` }),
      await keyRequest({
        method: "PUT",
        body: JSON.stringify({ value: `${keyValue}\nmore` }),
      }),
      await keyRequest({ method: "PUT", body: JSON.stringify({ value: 5 }) }),
    );
    const removed = await keyRequest({ method: "DELETE" });
    answers.push(removed, await check());
    await events.waitFor(isEventOfType("media-servers-changed"));

    expect(answers.map((answer) => answer.status)).toEqual([
      200, 200, 200, 200, 200, 400, 400, 400, 200, 200,
    ]);
    expect(bodyOf(answers[1] ?? saved)).toEqual({
      valid: false,
      message: "The server got no key.",
    });
    expect(bodyOf(saved)).toEqual({
      variable: "YUMEKIT_TEST_KEY",
      source: "key-file",
    });
    expect(bodyOf(answers[3] ?? saved)).toEqual({
      valid: true,
      message: "The server got a key.",
    });
    expect(bodyOf(removed)).toEqual({
      removed: true,
      variable: "YUMEKIT_TEST_KEY",
      source: "missing",
    });
    expect(control.body).toContain(keyValue);
    const everything = [
      ...answers.map((answer) => JSON.stringify(answer)),
      JSON.stringify(events.messages),
      ...output,
    ];
    expect(everything.filter((text) => text.includes(keyValue))).toEqual([]);
    expect(
      await readFile(join(configurationDirectory, "keys.json"), "utf8"),
    ).not.toContain(keyValue);
  });

  it("answers a check of a server that does not exist with 404", async () => {
    const { engine } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/keys/nobody/check",
      method: "POST",
      headers: withToken(engine),
    });

    expect(answer.status).toBe(404);
    expect(bodyOf(answer)).toMatchObject({ kind: "server-not-found" });
  });
});
