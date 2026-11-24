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
import { chooseAgent, type AgentPrograms } from "../agentChoice.js";
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
  const chosen = await chooseAgent(options.programs);
  if (!chosen.ok) return undefined;
  if ((await chosen.value.signInState()) === "signed-out") return undefined;
  return {
    adapter: chosen.value,
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

export function createCriticDesk(): CriticDesk {
  let running: { token: string; turn: Turn | undefined } | undefined;
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
      instructions: criticInstructionsOf(run.adapter.id),
      serverCommand: {
        command: run.serverCommand.command,
        args: [...run.serverCommand.args, helperFlag, token],
      },
      workingFolder,
      onEvent: () => undefined,
    });
    if (running !== undefined) running.turn = turn;
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
    return failed(
      end.kind === "stopped"
        ? `The critic of ${request.subject} was stopped, or took more than ${String(criticSecondsLimit)} seconds.`
        : `The critic of ${request.subject} stopped with a problem: ${end.message}`,
    );
  };
  let queue: Promise<unknown> = Promise.resolve();
  return {
    ask: ({ request, run }) => {
      if (run === undefined) {
        return Promise.resolve({ ok: false, failure: noCriticFailure });
      }
      const next = queue.then(async () => {
        const token = randomUUID();
        running = { token, turn: undefined };
        try {
          return await runTurn({ request, run, token });
        } finally {
          running = undefined;
        }
      });
      queue = next.catch(() => undefined);
      return next;
    },
    callOf: (token) => {
      if (token === undefined || running?.token !== token) return undefined;
      return {
        kind: "critic",
        refusalOf: ({ tool }) =>
          isCriticTool(tool)
            ? undefined
            : `A critic may only look with view_for_review and answer with give_clip_review or give_sheet_review, not call ${tool}.`,
      };
    },
    stop: () => {
      running?.turn?.stop();
    },
  };
}
