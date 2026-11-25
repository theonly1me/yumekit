import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  helperInstructionsOf,
  type AgentAdapter,
  type ModelChoice,
  type ServerCommand,
  type Turn,
} from "@yumekit/brain";
import {
  noHelperFailure,
  type HelperChange,
  type HelperOutcome,
  type HelperRequest,
} from "@yumekit/harness-mcp";
import { changesOfCall, helperRefusalOf } from "./helperScope.js";

export const helperFlag = "--helper";

export const noChatHelper: Promise<HelperOutcome> = Promise.resolve({
  ok: false,
  failure: noHelperFailure,
});

export interface LeadRun {
  adapter: AgentAdapter;
  choices: { lead: ModelChoice; critic: ModelChoice };
  serverCommand: ServerCommand;
  projectFolder: string;
}

export type HelperCall =
  | { kind: "lead" }
  | { kind: "ended" }
  | {
      kind: "critic";
      reviewJobId: string;
      refusalOf: (call: { tool: string }) => string | undefined;
    }
  | {
      kind: "helper";
      refusalOf: (call: {
        tool: string;
        input: Record<string, unknown>;
      }) => string | undefined;
      record: (call: { tool: string; input: Record<string, unknown> }) => void;
    };

export interface HelperDesk {
  ask: (options: {
    request: HelperRequest;
    lead: LeadRun | undefined;
  }) => Promise<HelperOutcome>;
  callOf: (token: string | undefined) => HelperCall;
  stop: () => void;
}

interface RunningHelper {
  token: string;
  request: HelperRequest;
  changed: HelperChange[];
  turn: Turn | undefined;
}

function failed(failure: {
  kind: string;
  message: string;
  hint: string;
}): HelperOutcome {
  return { ok: false, failure };
}

function requestTextOf(request: HelperRequest): string {
  const named = [
    ...request.sceneIds.map((id) => `scene ${id}`),
    ...request.assetIds.map((id) => `asset ${id}`),
  ].join(", ");
  return `${request.brief.trim()}\n\nYou may change only: ${named}.`;
}

function isSameChange(options: { first: HelperChange; second: HelperChange }) {
  return (
    options.first.kind === options.second.kind &&
    options.first.id === options.second.id
  );
}

export function createHelperDesk(): HelperDesk {
  let running: RunningHelper | undefined;
  const runTurn = async (options: {
    helper: RunningHelper;
    lead: LeadRun;
  }): Promise<HelperOutcome> => {
    const { helper, lead } = options;
    const workingFolder = join(lead.projectFolder, ".yumekit", "helper");
    await mkdir(workingFolder, { recursive: true });
    const texts: string[] = [];
    const turn = lead.adapter.startTurn({
      request: requestTextOf(helper.request),
      sessionId: undefined,
      choice: lead.choices.lead,
      instructions: helperInstructionsOf(lead.adapter.id),
      serverCommand: {
        command: lead.serverCommand.command,
        args: [...lead.serverCommand.args, helperFlag, helper.token],
      },
      workingFolder,
      onEvent: (event) => {
        if (event.type === "text" && !event.isPart) texts.push(event.text);
      },
    });
    helper.turn = turn;
    const end = await turn.ended;
    if (end.kind !== "done") {
      return failed({
        kind: "helper-failed",
        message:
          end.kind === "stopped"
            ? "The helper was stopped."
            : `The helper stopped with a problem: ${end.message}`,
        hint: "Check what it changed with get_work. Do the work yourself, or ask again with a shorter brief.",
      });
    }
    return { ok: true, text: texts.join("\n\n"), changed: helper.changed };
  };
  return {
    ask: async ({ request, lead }) => {
      if (lead === undefined) return failed(noHelperFailure);
      if (running !== undefined) {
        return failed({
          kind: "helper-busy",
          message: "A helper is still working. One helper runs at a time.",
          hint: "Wait for the result of the helper, then ask again.",
        });
      }
      const helper: RunningHelper = {
        token: randomUUID(),
        request,
        changed: [],
        turn: undefined,
      };
      running = helper;
      try {
        return await runTurn({ helper, lead });
      } finally {
        running = undefined;
      }
    },
    callOf: (token) => {
      if (token === undefined) return { kind: "lead" };
      const helper = running;
      if (helper?.token !== token) return { kind: "ended" };
      return {
        kind: "helper",
        refusalOf: ({ tool, input }) =>
          helperRefusalOf({ tool, input, request: helper.request }),
        record: ({ tool, input }) => {
          for (const change of changesOfCall({ tool, input })) {
            const isNew = !helper.changed.some((first) =>
              isSameChange({ first, second: change }),
            );
            if (isNew) helper.changed.push(change);
          }
        },
      };
    },
    stop: () => {
      running?.turn?.stop();
    },
  };
}
