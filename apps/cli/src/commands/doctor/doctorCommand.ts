import { listAgents } from "@yumekit/engine";
import { findBrowser, findFfmpeg, type RenderFailure } from "@yumekit/render";
import type { CommandResult } from "../../commandResult.js";
import { nodeVersionProblemOf } from "../../nodeVersion.js";

interface NeedLine {
  text: string;
  isMissing: boolean;
}

function lineOf(options: {
  need: string;
  failure: RenderFailure | undefined;
}): NeedLine {
  const { need, failure } = options;
  return failure === undefined
    ? { text: `ok       ${need}`, isMissing: false }
    : {
        text: `missing  ${need}. ${failure.message} ${failure.hint ?? ""}`.trim(),
        isMissing: true,
      };
}

function nodeLine(): NeedLine {
  const version = process.versions.node;
  const problem = nodeVersionProblemOf(version);
  return problem === undefined
    ? { text: `ok       Node.js ${version}`, isMissing: false }
    : { text: `missing  Node.js 22 or later. ${problem}`, isMissing: true };
}

async function agentsLine(): Promise<NeedLine> {
  const agents = await listAgents({ projectFolder: process.cwd() });
  const found = agents.filter((agent) => agent.installed);
  const text =
    found.length === 0
      ? "none     Agent programs. yumekit found none of Claude Code, Codex, or Cursor. The editor works without one."
      : `ok       Agent programs: ${found.map((agent) => agent.name).join(", ")}`;
  return { text, isMissing: false };
}

export async function doctorCommand(args: string[]): Promise<CommandResult> {
  if (args.length > 0) {
    return { kind: "usage-error", message: "doctor takes no arguments." };
  }
  const lines = [
    nodeLine(),
    lineOf({ need: "FFmpeg", failure: await findFfmpeg() }),
    lineOf({ need: "Chromium for Playwright", failure: await findBrowser() }),
    await agentsLine(),
  ];
  const output = `${lines.map((line) => line.text).join("\n")}\n`;
  return lines.some((line) => line.isMissing)
    ? { kind: "failed-with-output", output }
    : { kind: "done", output };
}
