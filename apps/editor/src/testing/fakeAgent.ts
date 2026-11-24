import { existsSync } from "node:fs";
import { chmod, mkdir, symlink, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

export type FakeStep =
  | { print: string }
  | { callTool: { name: string; input: object } }
  | { waitForStop: { print: string[] } }
  | { waitForFile: string }
  | { followRequest: true };

export interface FakeAgentScenario {
  steps: FakeStep[];
  helperSteps?: FakeStep[];
  exitCode?: number;
  signedIn?: boolean;
}

const fakeAgentFile = fileURLToPath(
  new URL(
    "../../../../packages/engine/src/chat/testing/fakeAgent.ts",
    import.meta.url,
  ),
);

async function linkMediaPrograms(folder: string): Promise<void> {
  const searched = (process.env["PATH"] ?? "").split(delimiter);
  for (const program of ["ffmpeg", "ffprobe"]) {
    const found = searched
      .map((searchedFolder) => join(searchedFolder, program))
      .find((candidate) => existsSync(candidate));
    if (found !== undefined) await symlink(found, join(folder, program));
  }
}

export async function installFakeAgent(options: {
  root: string;
  configurationFolder: string;
}): Promise<{ YUMEKIT_FAKE_AGENT_SCENARIO: string; PATH: string }> {
  const folder = join(options.root, "fake-agent");
  await mkdir(folder);
  const scenarioFile = join(folder, "scenario.json");
  const programPath = join(folder, "claude");
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeAgentFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  const codexPath = join(folder, "codex");
  await writeFile(codexPath, "#!/bin/sh\nexit 0\n");
  await chmod(codexPath, 0o755);
  await linkMediaPrograms(folder);
  await mkdir(options.configurationFolder, { recursive: true });
  await writeFile(
    join(options.configurationFolder, "settings.json"),
    JSON.stringify({
      agent: "claude-code",
      agentPrograms: { "claude-code": programPath },
    }),
  );
  await writeFakeScenario({ scenarioFile, scenario: { steps: [] } });
  return {
    YUMEKIT_FAKE_AGENT_SCENARIO: scenarioFile,
    PATH: [folder, "/usr/bin", "/bin"].join(delimiter),
  };
}

export async function writeFakeScenario(options: {
  scenarioFile: string;
  scenario: FakeAgentScenario;
}): Promise<void> {
  await writeFile(
    options.scenarioFile,
    JSON.stringify({
      exitCode: 0,
      signedIn: true,
      resumeFails: false,
      ...options.scenario,
    }),
  );
}

function line(value: object): string {
  return JSON.stringify(value);
}

export const claudeLines = {
  init: line({
    type: "system",
    subtype: "init",
    session_id: "made-up-editor-session",
    mcp_servers: [{ name: "yumekit", status: "connected" }],
  }),
  part: (text: string) =>
    line({
      type: "stream_event",
      event: {
        type: "content_block_delta",
        delta: { type: "text_delta", text },
      },
    }),
  whole: (text: string) =>
    line({ type: "assistant", message: { content: [{ type: "text", text }] } }),
  toolUse: (options: { callId: string; tool: string }) =>
    line({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            id: options.callId,
            name: `mcp__yumekit__${options.tool}`,
            input: {},
          },
        ],
      },
    }),
  toolResult: (callId: string) =>
    line({
      type: "user",
      message: {
        content: [
          { type: "tool_result", tool_use_id: callId, is_error: false },
        ],
      },
    }),
  result: (terminalReason: string) =>
    line({
      type: "result",
      is_error: terminalReason !== "completed",
      terminal_reason: terminalReason,
      total_cost_usd: 0.002,
      result: "",
    }),
  failedResult: (message: string) =>
    line({
      type: "result",
      is_error: true,
      terminal_reason: "completed",
      total_cost_usd: 0.002,
      result: message,
    }),
};

export const followingLeadScenario: FakeAgentScenario = {
  steps: [
    { print: claudeLines.init },
    { followRequest: true },
    {
      print: claudeLines.whole(
        "Done. I made it with the choices of the sheet.",
      ),
    },
    { print: claudeLines.result("completed") },
  ],
};
