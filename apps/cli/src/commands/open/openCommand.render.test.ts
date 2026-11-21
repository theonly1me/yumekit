import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { receiveEngineEvents } from "../../testing/engineEvents.js";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen, type OpenRun } from "../../testing/runOpen.js";

const runFile = promisify(execFile);

async function childrenOf(processId: number): Promise<number[]> {
  try {
    const { stdout } = await runFile("pgrep", ["-P", String(processId)]);
    return stdout.split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

async function isRunning(processId: number): Promise<boolean> {
  try {
    await runFile("ps", ["-p", String(processId)]);
    return true;
  } catch {
    return false;
  }
}

async function isPresent(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function callTool(options: { open: OpenRun; name: string; body: object }) {
  return fetch(`${options.open.origin}/api/tools/${options.name}`, {
    method: "POST",
    headers: { authorization: `Bearer ${options.open.token}` },
    body: JSON.stringify(options.body),
  });
}

async function openWithRunningRender() {
  const workspace = await createCliWorkspace({ home: "user" });
  const folder = join(workspace.root, "project");
  await workspace.run(["init", folder, "--output", "wide:640x360"]);
  const open = await runOpen({ folder, environment: workspace.environment });
  const events = await receiveEngineEvents(open);
  await callTool({
    open,
    name: "put_scene",
    body: {
      input: {
        scene_id: "intro",
        title: "Intro",
        kit_component: "title-card",
        props: { heading: "Stop me" },
      },
    },
  });
  await callTool({
    open,
    name: "set_timeline",
    body: {
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
                duration_frames: 300,
              },
            ],
          },
        ],
      },
    },
  });
  const render = callTool({
    open,
    name: "render_video",
    body: { input: { output_id: "wide", scale: 1 }, callId: "long-render" },
  }).catch(() => undefined);
  await events.waitFor("call-progress");
  return { folder, open, render };
}

describe("yumekit open stopped while a render runs", () => {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    it(`closes the engine on ${signal}, removes engine.json, and leaves no child process`, async () => {
      const { folder, open, render } = await openWithRunningRender();
      const children = await childrenOf(open.processId);

      const exitCode = await open.stop(signal);
      await render;
      const stillRunning = await Promise.all(children.map(isRunning));

      expect(children.length).toBeGreaterThan(1);
      expect(exitCode).toBe(0);
      expect(open.output()).toContain("the engine stopped");
      expect(await isPresent(join(folder, ".yumekit", "engine.json"))).toBe(
        false,
      );
      expect(stillRunning).toEqual(children.map(() => false));
    }, 120_000);
  }
});
