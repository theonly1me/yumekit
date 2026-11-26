import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AgentAdapter, RunAccess } from "./brainTypes.js";
import { createClaudeCodeAdapter } from "./claudeCode/claudeCodeAdapter.js";
import { createCodexAdapter } from "./codex/codexAdapter.js";
import { createCursorAdapter } from "./cursor/cursorAdapter.js";
import { claudeChangeStream } from "./testing/claudeStreams.js";
import { createFakeProgram, type FakeProgram } from "./testing/fakeProgram.js";

const adapters = {
  "claude-code": createClaudeCodeAdapter,
  codex: createCodexAdapter,
  cursor: createCursorAdapter,
} as const;

const programAccess: RunAccess = {
  kind: "program",
  readFolders: ["/Users/maya/Movies"],
  closedFolders: ["/Users/maya/.config/yumekit"],
  readOnly: {
    files: ["/work/film/project.json", "/work/film/takes.json"],
    folders: ["/work/film/scenes", "/work/film/.yumekit"],
  },
  allowedRules: ["WebFetch(domain:example.com)"],
};

async function argumentsOfTurn(options: {
  agentId: AgentAdapter["id"];
  access: RunAccess | undefined;
  fake?: FakeProgram;
}): Promise<string[]> {
  const fake =
    options.fake ?? (await createFakeProgram({ lines: claudeChangeStream }));
  const adapter = adapters[options.agentId]({ programPath: fake.programPath });
  const turn = adapter.startTurn({
    request: "Open example.com and describe it.",
    sessionId: undefined,
    instructions: "Answer in plain words.",
    serverCommand: { command: "/opt/node/bin/node", args: ["main.js"] },
    workingFolder: fake.workingFolder,
    access: options.access,
    onEvent: () => undefined,
  });
  await turn.ended;
  return (await fake.readRun()).arguments;
}

function valuesAfter(options: { flags: string[]; flag: string }): string[] {
  return [...options.flags.entries()].flatMap(([index, value]) =>
    options.flags[index - 1] === options.flag ? [value] : [],
  );
}

const hookSchema = z.object({
  matcher: z.string(),
  hooks: z.array(
    z.object({
      type: z.string(),
      server: z.string(),
      tool: z.string(),
      input: z.record(z.string(), z.string()),
    }),
  ),
});

const settingsSchema = z.object({
  permissions: z.object({ deny: z.array(z.string()) }),
  hooks: z.object({ PreToolUse: z.array(hookSchema) }),
});

describe("what the lead may do in each agent program", () => {
  it("starts Claude Code in auto mode with its own tools, the permission card of yumekit, the allowed folders, and the rules of this project", async () => {
    const flags = await argumentsOfTurn({
      agentId: "claude-code",
      access: programAccess,
    });

    expect(flags).not.toContain("--tools");
    expect(flags).not.toContain("--strict-mcp-config");
    expect(flags).not.toContain("--setting-sources");
    expect(valuesAfter({ flags, flag: "--permission-mode" })).toEqual(["auto"]);
    expect(valuesAfter({ flags, flag: "--permission-prompt-tool" })).toEqual([
      "mcp__yumekit__ask_permission",
    ]);
    expect(valuesAfter({ flags, flag: "--add-dir" })).toEqual([
      "/Users/maya/Movies",
    ]);
    const allowed = flags.indexOf("--allowedTools");
    expect(flags.slice(allowed + 1, allowed + 3)).toEqual([
      "mcp__yumekit__*",
      "WebFetch(domain:example.com)",
    ]);
  });

  it("denies a direct edit of each file of the store and each read or edit of the key folder", async () => {
    const flags = await argumentsOfTurn({
      agentId: "claude-code",
      access: programAccess,
    });
    const [settingsText = "{}"] = valuesAfter({ flags, flag: "--settings" });
    const settings = settingsSchema.parse(JSON.parse(settingsText));

    expect(settings.permissions.deny).toEqual([
      "Read(//Users/maya/.config/yumekit/**)",
      "Edit(//Users/maya/.config/yumekit/**)",
      "Edit(//work/film/project.json)",
      "Edit(//work/film/takes.json)",
      "Edit(//work/film/scenes/**)",
      "Edit(//work/film/.yumekit/**)",
    ]);
    expect(
      settings.hooks.PreToolUse.map((hook) => ({
        matcher: hook.matcher,
        tools: hook.hooks.map((handler) => `${handler.server} ${handler.tool}`),
      })),
    ).toEqual([
      { matcher: "Read", tools: ["yumekit check_file_access"] },
      { matcher: "Grep|Glob", tools: ["yumekit check_file_access"] },
      { matcher: "Bash", tools: ["yumekit check_file_access"] },
    ]);
  });

  it("keeps the locked run of Claude Code for only the yumekit tools, and for a helper or the critic that gives no access", async () => {
    const locked = [
      "--strict-mcp-config",
      "--tools",
      "",
      "--allowedTools",
      "mcp__yumekit__*",
      "--permission-mode",
      "dontAsk",
      "--setting-sources",
      "",
    ];
    for (const access of [{ kind: "yumekit-only" } as const, undefined]) {
      const flags = await argumentsOfTurn({ agentId: "claude-code", access });
      const start = flags.indexOf("--strict-mcp-config");

      expect(flags.slice(start, start + locked.length)).toEqual(locked);
      expect(flags).not.toContain("--permission-prompt-tool");
    }
  });

  it("gives Codex and Cursor the same locked arguments for both choices, because neither can send a question to yumekit", async () => {
    for (const agentId of ["codex", "cursor"] as const) {
      const fake = await createFakeProgram({ lines: claudeChangeStream });
      const asked = await argumentsOfTurn({
        agentId,
        access: programAccess,
        fake,
      });
      const locked = await argumentsOfTurn({
        agentId,
        access: { kind: "yumekit-only" },
        fake,
      });

      expect(asked).toEqual(locked);
    }
  });
});
