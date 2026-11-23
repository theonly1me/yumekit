import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Turn } from "@yumekit/brain";
import type { ProjectStore } from "@yumekit/project";
import type { ServerCommand } from "../agents/agentTypes.js";
import type { Outcome } from "../engineTypes.js";
import type { EventHub } from "../events/eventHub.js";
import { chooseAgent, findAgentPrograms } from "./agentChoice.js";
import { aboutOf, requestTextOf } from "./aboutClip.js";
import { createChangeLedger } from "./changeLedger.js";
import { loadChat } from "./chatFile.js";
import { createChatLog } from "./chatLog.js";
import type {
  AnswerEntry,
  ChangeEntry,
  ChatFailure,
  ChatView,
  RequestEntry,
} from "./chatTypes.js";
import { runRequest, signInMessageOf } from "./requestRun.js";
import type { ToolCaller, TrackedStore } from "./trackedStore.js";
import { undoChangeWith } from "./undoChange.js";

export interface Chat {
  view: () => Promise<ChatView>;
  startRequest: (options: {
    text: string;
    details?: string | undefined;
    aboutClipId: string | undefined;
  }) => Promise<Outcome<RequestEntry, ChatFailure>>;
  stop: () => boolean;
  undoChange: (changeId: string) => Promise<Outcome<ChangeEntry, ChatFailure>>;
  runToolCall: <Value>(options: {
    caller: ToolCaller;
    call: () => Promise<Value>;
  }) => Promise<Value>;
  close: () => Promise<void>;
}

const chatBusy: ChatFailure = {
  kind: "chat-busy",
  message: "The AI is still working on the last request. Wait or stop it.",
};

const noServerCommand: ChatFailure = {
  kind: "no-server-command",
  message:
    "This engine cannot start the AI. Start the editor with yumekit open.",
};

function failed<Value>(failure: ChatFailure): Outcome<Value, ChatFailure> {
  return { ok: false, failure };
}

export async function createChat(options: {
  projectFolder: string;
  store: ProjectStore;
  tracked: TrackedStore;
  events: EventHub;
  serverCommand: ServerCommand | undefined;
}): Promise<Chat> {
  const { projectFolder, tracked } = options;
  const programs = await findAgentPrograms();
  const log = createChatLog({
    projectFolder,
    chat: await loadChat(projectFolder),
    events: options.events,
  });
  const ledger = createChangeLedger(log);
  tracked.onCommit(ledger.onCommit);
  let phase: "idle" | "starting" | "running" = "idle";
  let turn: Turn | undefined;
  let isStopRequested = false;
  let running: Promise<void> = Promise.resolve();
  const begin = async (request: {
    text: string;
    details?: string | undefined;
    aboutClipId: string | undefined;
  }): Promise<Outcome<RequestEntry, ChatFailure>> => {
    if (options.serverCommand === undefined) return failed(noServerCommand);
    const about = aboutOf({
      snapshot: options.store.read(),
      clipId: request.aboutClipId,
    });
    if (!about.ok) return about;
    const chosen = await chooseAgent(programs);
    if (!chosen.ok) return chosen;
    const adapter = chosen.value;
    if ((await adapter.signInState()) === "signed-out") {
      return failed({
        kind: "agent-signed-out",
        message: signInMessageOf(adapter),
      });
    }
    const workingFolder = join(projectFolder, ".yumekit", "agent");
    await mkdir(workingFolder, { recursive: true });
    const entry: RequestEntry = {
      kind: "request",
      id: randomUUID(),
      text: request.text,
      ...(request.details === undefined ? {} : { details: request.details }),
      about: about.value,
    };
    log.put(entry);
    const answer: AnswerEntry = {
      kind: "answer",
      id: randomUUID(),
      text: "",
      state: "running",
      steps: [],
    };
    log.put(answer);
    phase = "running";
    isStopRequested = false;
    running = runRequest({
      adapter,
      log,
      ledger,
      requestText: requestTextOf({
        text: [request.text, request.details ?? ""].join("\n").trim(),
        about: about.value,
      }),
      answer,
      serverCommand: options.serverCommand,
      workingFolder,
      onTurn: (next) => {
        turn = next;
        if (isStopRequested) next.stop();
      },
      isStopRequested: () => isStopRequested,
    })
      .catch(() => undefined)
      .finally(() => {
        phase = "idle";
        turn = undefined;
      });
    return { ok: true, value: entry };
  };
  const stop = () => {
    if (phase !== "running") return false;
    isStopRequested = true;
    turn?.stop();
    return true;
  };
  return {
    view: async () => {
      const chosen = await chooseAgent(programs);
      return {
        agent: chosen.ok
          ? {
              id: chosen.value.id,
              name: chosen.value.name,
              signIn: await chosen.value.signInState(),
            }
          : null,
        state: phase === "idle" ? "idle" : "running",
        entries: log.entries(),
      };
    },
    startRequest: async (request) => {
      if (phase !== "idle") return failed(chatBusy);
      phase = "starting";
      const started = await begin(request).catch(
        (): Outcome<RequestEntry, ChatFailure> =>
          failed({
            kind: "no-agent",
            message: "The AI program did not start.",
          }),
      );
      if (!started.ok) phase = "idle";
      return started;
    },
    stop,
    undoChange: (changeId) =>
      phase === "idle"
        ? undoChangeWith({ changeId, log, ledger, tracked })
        : Promise.resolve(failed(chatBusy)),
    runToolCall: tracked.runCall,
    close: async () => {
      stop();
      await running;
      await log.flush();
    },
  };
}
