import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen, type OpenRun } from "../../testing/runOpen.js";

const fakeClaudeFile = fileURLToPath(
  new URL("../../testing/fakeClaudeWithBridge.ts", import.meta.url),
);

const chatSchema = z.object({
  state: z.enum(["idle", "running"]),
  entries: z.array(z.looseObject({ kind: z.string() })),
});

async function engineRequest(options: {
  open: OpenRun;
  path: string;
  body?: object;
}): Promise<unknown> {
  const answer = await fetch(`${options.open.origin}${options.path}`, {
    method: options.body === undefined ? "GET" : "POST",
    headers: {
      authorization: `Bearer ${options.open.token}`,
      "content-type": "application/json",
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  const value: unknown = await answer.json();
  return value;
}

async function idleChat(open: OpenRun) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const chat = chatSchema.parse(
      await engineRequest({ open, path: "/api/chat" }),
    );
    if (chat.state === "idle") return chat;
    await delay(50);
  }
  throw new Error("The chat request did not end.");
}

describe("the chat of yumekit open", () => {
  it("runs the agent program with the bridge of the engine, so its change has one undo step in the chat", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder, "--output", "wide:320x180"]);
    const programPath = join(workspace.root, "bin", "claude");
    await mkdir(join(programPath, ".."));
    await writeFile(
      programPath,
      `#!/bin/sh\nexec "${process.execPath}" "${fakeClaudeFile}" "$@"\n`,
    );
    await chmod(programPath, 0o755);
    await mkdir(workspace.configurationDirectory, { recursive: true });
    await writeFile(
      join(workspace.configurationDirectory, "settings.json"),
      JSON.stringify({
        agent: "claude-code",
        agentPrograms: { "claude-code": programPath },
      }),
    );
    const open = await runOpen({ folder, environment: workspace.environment });

    await engineRequest({
      open,
      path: "/api/chat/requests",
      body: { text: "Set the script to the single word ready." },
    });
    const { entries } = await idleChat(open);

    expect(entries).toEqual([
      expect.objectContaining({ kind: "request" }),
      expect.objectContaining({
        kind: "answer",
        state: "done",
        steps: [{ callId: "bridge-call-1", tool: "set_script", state: "done" }],
      }),
      expect.objectContaining({
        kind: "change",
        by: "ai",
        summary: "The script says ready.",
        undoSteps: 1,
      }),
    ]);
    expect(await engineRequest({ open, path: "/api/project" })).toMatchObject({
      script: "ready",
    });
  }, 120_000);
});
