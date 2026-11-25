import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { AgentAdapter, Turn } from "@yumekit/brain";
import type { ProjectStore } from "@yumekit/project";
import type { ServerCommand } from "../agents/agentTypes.js";
import type { Outcome } from "../engineTypes.js";
import {
  chooseAgentRun,
  type AgentPrograms,
  type RoleChoices,
} from "./agentChoice.js";
import { aboutOf, requestTextOf } from "./aboutClip.js";
import { createAnswerTracker, type AnswerTracker } from "./answerTracker.js";
import type { ChangeLedger } from "./changeLedger.js";
import { failed, noServerCommand } from "./chatFailures.js";
import type { ChatLog } from "./chatLog.js";
import type { AnswerEntry, ChatFailure, RequestEntry } from "./chatTypes.js";
import type { LeadRun } from "./helpers/helperDesk.js";
import { runRequest, signInMessageOf } from "./requestRun.js";
import type { SteeringDesk } from "./steering/steeringDesk.js";
import { steeringRequestTextOf } from "./steering/steeringText.js";

export interface RunState {
  phase: "idle" | "starting" | "running";
  turn: Turn | undefined;
  tracker: AnswerTracker | undefined;
  isStopRequested: boolean;
  isClosing: boolean;
  running: Promise<void>;
  lead: LeadRun | undefined;
}

export interface ChatParts {
  projectFolder: string;
  store: ProjectStore;
  serverCommand: ServerCommand | undefined;
  programs: AgentPrograms;
  log: ChatLog;
  ledger: ChangeLedger;
  steering: SteeringDesk;
  state: RunState;
  onEnded: () => void;
}

interface ReadyLead {
  adapter: AgentAdapter;
  choices: RoleChoices;
  serverCommand: ServerCommand;
  workingFolder: string;
}

async function readyLeadOf(
  parts: ChatParts,
): Promise<Outcome<ReadyLead, ChatFailure>> {
  const { serverCommand } = parts;
  if (serverCommand === undefined) return failed(noServerCommand);
  const chosen = await chooseAgentRun(parts.programs);
  if (!chosen.ok) return chosen;
  const { adapter, choices } = chosen.value;
  if ((await adapter.signInState()) === "signed-out") {
    return failed({
      kind: "agent-signed-out",
      message: signInMessageOf(adapter),
    });
  }
  const workingFolder = join(parts.projectFolder, ".yumekit", "agent");
  await mkdir(workingFolder, { recursive: true });
  return {
    ok: true,
    value: { adapter, choices, serverCommand, workingFolder },
  };
}

function madeWithOf(ready: ReadyLead): AnswerEntry["madeWith"] {
  const { model, effort } = ready.choices.lead;
  return {
    program: ready.adapter.name,
    ...(model === undefined ? {} : { model }),
    ...(effort === undefined ? {} : { effort }),
  };
}

function launch(options: {
  parts: ChatParts;
  ready: ReadyLead;
  requestText: string;
}): void {
  const { parts, ready } = options;
  const { state, log } = parts;
  const answer: AnswerEntry = {
    kind: "answer",
    id: randomUUID(),
    text: "",
    state: "running",
    steps: [],
    madeWith: madeWithOf(ready),
  };
  log.put(answer);
  const tracker = createAnswerTracker({ log, answer });
  state.tracker = tracker;
  state.lead = {
    adapter: ready.adapter,
    choices: ready.choices,
    serverCommand: ready.serverCommand,
    projectFolder: parts.projectFolder,
  };
  state.phase = "running";
  state.isStopRequested = false;
  state.running = runRequest({
    ...ready,
    choice: ready.choices.lead,
    log,
    ledger: parts.ledger,
    requestText: options.requestText,
    tracker,
    onTurn: (next) => {
      state.turn = next;
      if (state.isStopRequested) next.stop();
    },
    isStopRequested: () => state.isStopRequested,
  })
    .catch(() => undefined)
    .finally(() => {
      state.phase = "idle";
      state.turn = undefined;
      state.tracker = undefined;
      state.lead = undefined;
      parts.onEnded();
    });
}

export async function beginPersonRequest(options: {
  parts: ChatParts;
  request: {
    text: string;
    details?: string | undefined;
    aboutClipId: string | undefined;
  };
}): Promise<Outcome<RequestEntry, ChatFailure>> {
  const { parts, request } = options;
  const about = aboutOf({
    snapshot: parts.store.read(),
    clipId: request.aboutClipId,
  });
  if (!about.ok) return about;
  const ready = await readyLeadOf(parts);
  if (!ready.ok) return ready;
  const entry: RequestEntry = {
    kind: "request",
    id: randomUUID(),
    text: request.text,
    ...(request.details === undefined ? {} : { details: request.details }),
    about: about.value,
  };
  parts.log.put(entry);
  launch({
    parts,
    ready: ready.value,
    requestText: requestTextOf({
      text: [request.text, request.details ?? ""].join("\n").trim(),
      about: about.value,
    }),
  });
  return { ok: true, value: entry };
}

export async function beginSteeringRequest(
  parts: ChatParts,
): Promise<Outcome<number, ChatFailure>> {
  const ready = await readyLeadOf(parts);
  if (!ready.ok) return ready;
  const messages = parts.steering.take();
  if (messages.length === 0) return { ok: true, value: 0 };
  launch({
    parts,
    ready: ready.value,
    requestText: steeringRequestTextOf(messages),
  });
  return { ok: true, value: messages.length };
}
