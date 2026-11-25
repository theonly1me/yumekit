import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { criticInstructionsOf, type Turn } from "@yumekit/brain";
import {
  isCriticTool,
  noCriticFailure,
  type CriticRequest,
  type CriticTurn,
} from "@yumekit/harness-mcp";
import type { ServerCommand } from "../../agents/agentTypes.js";
import { chooseAgentRun, type AgentPrograms } from "../agentChoice.js";
import { refusedChoiceTextOf } from "../refusedChoice.js";
import { helperFlag, type HelperCall, type LeadRun } from "./helperDesk.js";

export const criticSecondsLimit = 360;

export interface CriticDesk {
  ask: (options: {
    request: CriticRequest;
    run: LeadRun | undefined;
  }) => Promise<CriticTurn>;
  callOf: (token: string | undefined) => HelperCall | undefined;
  stop: () => void;
}

export async function personCriticRun(options: {
  isPerson: boolean;
  programs: AgentPrograms;
  serverCommand: ServerCommand | undefined;
  projectFolder: string;
}): Promise<LeadRun | undefined> {
  const { serverCommand } = options;
  if (!options.isPerson || serverCommand === undefined) return undefined;
  const chosen = await chooseAgentRun(options.programs);
  if (!chosen.ok) return undefined;
  const { adapter, choices } = chosen.value;
  if ((await adapter.signInState()) === "signed-out") return undefined;
  return {
    adapter,
    choices,
    serverCommand,
    projectFolder: options.projectFolder,
  };
}

function failed(message: string): CriticTurn {
  return {
    ok: false,
    failure: {
      kind: "critic-failed",
      message,
      hint: "Call the review again. Use nothing that has no review.",
    },
  };
}

interface RunningCritic {
  jobId: string;
  turn: Turn | undefined;
}

function refusalOf(options: { run: LeadRun; message: string }) {
  return refusedChoiceTextOf({
    message: options.message,
    choice: options.run.choices.critic,
    role: "critic",
    programName: options.run.adapter.name,
  });
}

export function createCriticDesk(options: {
  onNotice: (text: string) => void;
}): CriticDesk {
  const running = new Map<string, RunningCritic>();
  const noticed = new Set<string>();
  const failedWith = (failure: { run: LeadRun; message: string }) => {
    const refusal = refusalOf(failure);
    if (refusal !== undefined && !noticed.has(refusal)) {
      noticed.add(refusal);
      options.onNotice(refusal);
    }
    return refusal;
  };
  const runTurn = async (options: {
    request: CriticRequest;
    run: LeadRun;
    token: string;
  }): Promise<CriticTurn> => {
    const { run, request, token } = options;
    const workingFolder = join(run.projectFolder, ".yumekit", "critic");
    await mkdir(workingFolder, { recursive: true });
    const started = Date.now();
    const turn = run.adapter.startTurn({
      request: request.brief,
      sessionId: undefined,
      choice: run.choices.critic,
      instructions: criticInstructionsOf(run.adapter.id),
      serverCommand: {
        command: run.serverCommand.command,
        args: [...run.serverCommand.args, helperFlag, token],
      },
      workingFolder,
      onEvent: () => undefined,
    });
    const entry = running.get(token);
    if (entry !== undefined) entry.turn = turn;
    const timer = setTimeout(() => {
      turn.stop();
    }, criticSecondsLimit * 1000);
    const end = await turn.ended.finally(() => {
      clearTimeout(timer);
    });
    const seconds = (Date.now() - started) / 1000;
    if (end.kind === "done") {
      return {
        ok: true,
        seconds,
        ...(end.costUsd === undefined ? {} : { costUsd: end.costUsd }),
      };
    }
    if (end.kind === "stopped") {
      return failed(
        `The critic of ${request.subject} was stopped, or took more than ${String(criticSecondsLimit)} seconds.`,
      );
    }
    return failed(
      failedWith({ run, message: end.message }) ??
        `The critic of ${request.subject} stopped with a problem: ${end.message}`,
    );
  };
  return {
    ask: async ({ request, run }) => {
      if (run === undefined) return { ok: false, failure: noCriticFailure };
      const token = randomUUID();
      running.set(token, { jobId: request.jobId, turn: undefined });
      try {
        return await runTurn({ request, run, token });
      } finally {
        running.delete(token);
      }
    },
    callOf: (token) => {
      const entry = token === undefined ? undefined : running.get(token);
      if (entry === undefined) return undefined;
      return {
        kind: "critic",
        reviewJobId: entry.jobId,
        refusalOf: ({ tool }) =>
          isCriticTool(tool)
            ? undefined
            : `A critic may only look with view_for_review and answer with give_clip_review, give_sheet_review, give_plan_review, or give_start_review, not call ${tool}.`,
      };
    },
    stop: () => {
      running.forEach((entry) => {
        entry.turn?.stop();
      });
    },
  };
}
