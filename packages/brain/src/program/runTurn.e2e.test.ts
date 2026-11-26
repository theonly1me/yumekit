import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { createCodexAdapter } from "../codex/codexAdapter.js";
import { codexStart } from "../testing/codexStreams.js";
import { createFakeProgram } from "../testing/fakeProgram.js";
import { findProgram } from "./findProgram.js";
import { stopWaitMilliseconds } from "./runTurn.js";

describe("a turn of a program", () => {
  it("kills a program that ignores the stop signal after the wait", async () => {
    const fake = await createFakeProgram({
      lines: codexStart,
      untilInterrupt: { lines: [], exitCode: 1 },
      ignoresInterrupt: true,
    });
    const turn = createCodexAdapter({
      programPath: fake.programPath,
    }).startTurn({
      request: "Wait.",
      sessionId: undefined,
      instructions: "",
      serverCommand: { command: "/bin/false", args: [] },
      workingFolder: fake.workingFolder,
      onEvent: () => {
        turn.stop();
      },
    });
    const stoppedAt = Date.now();

    expect(await turn.ended).toEqual({ kind: "stopped" });
    expect(Date.now() - stoppedAt).toBeGreaterThanOrEqual(
      stopWaitMilliseconds - 500,
    );
  }, 20_000);

  it("gives failed program when the program does not exist", async () => {
    const turn = createCodexAdapter({
      programPath: "/no/such/folder/codex",
    }).startTurn({
      request: "Hi.",
      sessionId: undefined,
      instructions: "",
      serverCommand: { command: "/bin/false", args: [] },
      workingFolder: tmpdir(),
      onEvent: () => undefined,
    });

    expect(await turn.ended).toMatchObject({
      kind: "failed",
      reason: "program",
    });
  });

  it("finds the first match on the search path and skips a folder without it", async () => {
    const root = await mkdtemp(join(tmpdir(), "yumekit-path-"));
    onTestFinished(() => rm(root, { recursive: true, force: true }));
    const empty = join(root, "empty");
    await mkdir(empty);
    const fake = await createFakeProgram({ lines: [] });
    const folderOfFake = join(fake.programPath, "..");

    expect(
      await findProgram({
        program: "agent",
        searchPath: [empty, "relative", folderOfFake].join(delimiter),
      }),
    ).toBe(fake.programPath);
    expect(
      await findProgram({ program: "agent", searchPath: empty }),
    ).toBeUndefined();
  });
});
