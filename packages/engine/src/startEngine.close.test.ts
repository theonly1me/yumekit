import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "./testing/engineFixture.js";
import { isEventOfType, openEvents } from "./testing/eventsClient.js";
import { callTool, rawRequest, titleScene } from "./testing/rawRequest.js";

const runFile = promisify(execFile);

async function childProcessIds(): Promise<number[]> {
  try {
    const { stdout } = await runFile("pgrep", ["-P", String(process.pid)]);
    return stdout.split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

async function isChildCommand(pattern: RegExp): Promise<boolean> {
  const { stdout } = await runFile("ps", ["-A", "-o", "ppid=,command="]);
  return stdout
    .split("\n")
    .some(
      (line) =>
        line.trim().startsWith(`${String(process.pid)} `) && pattern.test(line),
    );
}

describe("the close of the engine", () => {
  it("closes the media servers and the renderer browser of a running render, and leaves no child process", async () => {
    const before = await childProcessIds();
    const { engine } = await startedTestEngine();
    const events = await openEvents(engine);
    await callTool({ ...engine, name: "put_scene", input: titleScene });
    await callTool({
      ...engine,
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 30,
              },
            ],
          },
        ],
      },
    });
    const render = callTool({
      ...engine,
      name: "render_video",
      input: { output_id: "wide", scale: 0.25 },
      callId: "render-one",
    });
    await events.waitFor(isEventOfType("call-progress"));
    const duringRender = await childProcessIds();
    const hasBrowser = await isChildCommand(/chrom/i);

    const closing = engine.close();
    const closed = await events.closed;
    await closing;
    const rendered = await render.catch(() => undefined);
    const after = await childProcessIds();

    expect(duringRender.length).toBeGreaterThan(before.length);
    expect(hasBrowser).toBe(true);
    expect(events.messages).toContainEqual({ type: "engine-closing" });
    expect(closed).toBe(1001);
    expect(rendered === undefined || rendered.status === 200).toBe(true);
    expect(after).toEqual(before);
    await expect(
      rawRequest({ port: engine.port, path: "/api/health" }),
    ).rejects.toThrow();
  });

  it("sends call-progress with the call id while a render runs", async () => {
    const { engine } = await startedTestEngine();
    const events = await openEvents(engine);
    await callTool({ ...engine, name: "put_scene", input: titleScene });
    await callTool({
      ...engine,
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 6,
              },
            ],
          },
        ],
      },
    });

    const answer = await callTool({
      ...engine,
      name: "render_video",
      input: { output_id: "wide", scale: 0.25 },
      callId: "render-two",
    });

    expect(answer.status).toBe(200);
    expect(events.messages).toContainEqual(
      expect.objectContaining({
        type: "call-progress",
        callId: "render-two",
        done: 6,
        total: 6,
      }),
    );
  });
});
