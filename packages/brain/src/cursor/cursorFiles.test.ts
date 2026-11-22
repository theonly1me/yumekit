import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFakeProgram } from "../testing/fakeProgram.js";
import { cursorInit, cursorResult } from "../testing/cursorStreams.js";
import { createCursorAdapter } from "./cursorAdapter.js";

const serverCommand = {
  command: "/opt/node/bin/node",
  args: ["/opt/yumekit/main.js", "mcp", "--project", "/work/my project"],
};

async function runCursor(sessionId: string | undefined) {
  const fake = await createFakeProgram({
    lines: [cursorInit, cursorResult({ isError: false })],
  });
  const turn = createCursorAdapter({ programPath: fake.programPath }).startTurn(
    {
      request: "-Set the script to ready.",
      sessionId,
      instructions: "Line one.\nLine two.",
      serverCommand,
      workingFolder: fake.workingFolder,
      onEvent: () => undefined,
    },
  );
  expect(await turn.ended).toEqual({ kind: "done" });
  const yumekitFolder = join(fake.workingFolder, "..");
  return {
    run: await fake.readRun(),
    agentFolder: join(yumekitFolder, "agent-cursor"),
    configurationFolder: join(yumekitFolder, "agent-cursor-config"),
  };
}

async function readJson(file: string): Promise<unknown> {
  const value: unknown = JSON.parse(await readFile(file, "utf8"));
  return value;
}

describe("the files and the start of a Cursor turn", () => {
  it("writes the server, the permissions of the design, and the instructions as a rule that always applies", async () => {
    const { agentFolder } = await runCursor(undefined);
    const cursorFolder = join(agentFolder, ".cursor");

    expect(await readJson(join(cursorFolder, "mcp.json"))).toEqual({
      mcpServers: {
        yumekit: {
          type: "stdio",
          command: "/opt/node/bin/node",
          args: [
            "/opt/yumekit/main.js",
            "mcp",
            "--project",
            "/work/my project",
          ],
        },
      },
    });
    expect(await readJson(join(cursorFolder, "cli.json"))).toEqual({
      permissions: {
        allow: ["Mcp(yumekit:*)"],
        deny: [
          "Shell(*)",
          "Write(**)",
          "Write(/**)",
          "Read(**)",
          "Read(/**)",
          "WebFetch(*)",
        ],
      },
    });
    expect(
      await readFile(join(cursorFolder, "rules", "yumekit.mdc"), "utf8"),
    ).toBe("---\nalwaysApply: true\n---\n\nLine one.\nLine two.\n");
  });

  it("runs the program in the agent folder with its own configuration folder and the flags of the design", async () => {
    const { run, agentFolder, configurationFolder } =
      await runCursor(undefined);

    expect(run.folder).toBe(await realpath(agentFolder));
    expect(run.cursorConfigurationFolder).toBe(configurationFolder);
    expect(run.arguments).toEqual([
      "-p",
      "--output-format",
      "stream-json",
      "--stream-partial-output",
      "--approve-mcps",
      "--trust",
      "--workspace",
      agentFolder,
      "--",
      "-Set the script to ready.",
    ]);
  });

  it("resumes a session with its id before the request", async () => {
    const { run } = await runCursor("made-up-session");

    expect(run.arguments.slice(-4)).toEqual([
      "--resume",
      "made-up-session",
      "--",
      "-Set the script to ready.",
    ]);
  });
});
