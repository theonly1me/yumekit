import { describe, expect, it } from "vitest";
import type { AgentAdapter, ModelChoice } from "./brainTypes.js";
import { createClaudeCodeAdapter } from "./claudeCode/claudeCodeAdapter.js";
import { createCodexAdapter } from "./codex/codexAdapter.js";
import { createCursorAdapter } from "./cursor/cursorAdapter.js";
import { claudeChangeStream } from "./testing/claudeStreams.js";
import { createFakeProgram } from "./testing/fakeProgram.js";

const adapters = {
  "claude-code": createClaudeCodeAdapter,
  codex: createCodexAdapter,
  cursor: createCursorAdapter,
} as const;

async function argumentsOfTurn(options: {
  agentId: AgentAdapter["id"];
  choice: ModelChoice | undefined;
}): Promise<string[]> {
  const fake = await createFakeProgram({ lines: claudeChangeStream });
  const adapter = adapters[options.agentId]({ programPath: fake.programPath });
  const turn = adapter.startTurn({
    request: "Set the script to the single word ready.",
    sessionId: undefined,
    instructions: "Answer in plain words.",
    serverCommand: { command: "/opt/node/bin/node", args: ["main.js"] },
    workingFolder: fake.workingFolder,
    choice: options.choice,
    onEvent: () => undefined,
  });
  await turn.ended;
  return (await fake.readRun()).arguments;
}

function flagValueOf(options: { flags: string[]; flag: string }) {
  const index = options.flags.indexOf(options.flag);
  return index === -1 ? undefined : options.flags[index + 1];
}

describe("the model and the effort of a turn", () => {
  it("gives Claude Code --model and --effort before the request", async () => {
    const flags = await argumentsOfTurn({
      agentId: "claude-code",
      choice: { model: "sonnet", effort: "low" },
    });

    expect(flagValueOf({ flags, flag: "--model" })).toBe("sonnet");
    expect(flagValueOf({ flags, flag: "--effort" })).toBe("low");
    expect(flags.indexOf("--effort")).toBeLessThan(flags.indexOf("--"));
  });

  it("gives Codex the model and the reasoning effort as settings", async () => {
    const flags = await argumentsOfTurn({
      agentId: "codex",
      choice: { model: "gpt-made-up", effort: "high" },
    });

    expect(flags).toEqual(
      expect.arrayContaining([
        'model="gpt-made-up"',
        'model_reasoning_effort="high"',
      ]),
    );
    expect(flags.indexOf('model="gpt-made-up"')).toBeLessThan(
      flags.indexOf("--"),
    );
  });

  it("gives Cursor --model and no effort, because Cursor has no effort flag", async () => {
    const flags = await argumentsOfTurn({
      agentId: "cursor",
      choice: { model: "auto", effort: "high" },
    });

    expect(flagValueOf({ flags, flag: "--model" })).toBe("auto");
    expect(flags.join(" ")).not.toContain("high");
  });

  it.each(["claude-code", "codex", "cursor"] as const)(
    "gives %s no model and no effort flag when the person chose none",
    async (agentId) => {
      const flags = await argumentsOfTurn({ agentId, choice: undefined });

      expect(flags.join(" ")).not.toMatch(/--model|--effort|model=|-m /);
    },
  );
});
