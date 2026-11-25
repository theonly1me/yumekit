import { randomUUID } from "node:crypto";
import type { ProjectStore } from "@yumekit/project";
import type { ServerCommand } from "../agents/agentTypes.js";
import type { Outcome } from "../engineTypes.js";
import type { EventHub } from "../events/eventHub.js";
import { findAgentPrograms } from "./agentChoice.js";
import { aboutOf } from "./aboutClip.js";
import { createChangeLedger } from "./changeLedger.js";
import type { Chat } from "./chatInterface.js";
import { chatBusy, failed } from "./chatFailures.js";
import { createHelperDesk } from "./helpers/helperDesk.js";
import { createCriticDesk, personCriticRun } from "./helpers/criticDesk.js";
import { loadChat } from "./chatFile.js";
import { createChatLog } from "./chatLog.js";
import type { ChatFailure, RequestEntry, SteeringEntry } from "./chatTypes.js";
import {
  beginPersonRequest,
  beginSteeringRequest,
  type ChatParts,
  type RunState,
} from "./requestStart.js";
import { steeredLeadCall } from "./steering/steeredCall.js";
import { createSteeringDesk } from "./steering/steeringDesk.js";
import type { TrackedStore } from "./trackedStore.js";
import { noCallNote } from "./stepNotes.js";
import { undoChangeWith } from "./undoChange.js";
import { chatViewOf } from "./chatView.js";

export type { Chat } from "./chatInterface.js";

const agentDidNotStart: ChatFailure = {
  kind: "no-agent",
  message: "The AI program did not start.",
};

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
  const steering = createSteeringDesk(log);
  const state: RunState = {
    phase: "idle",
    turn: undefined,
    tracker: undefined,
    isStopRequested: false,
    isClosing: false,
    running: Promise.resolve(),
    lead: undefined,
  };
  let starting: Promise<unknown> = Promise.resolve();
  const helpers = createHelperDesk();
  const critics = createCriticDesk({
    onNotice: (text) => {
      log.put({ kind: "notice", id: randomUUID(), text });
    },
  });
  const startWaitingMessages = async () => {
    if (state.isClosing || state.phase !== "idle") return;
    if (steering.waiting().length === 0) return;
    state.phase = "starting";
    const beginning = beginSteeringRequest(parts).catch(
      (): Outcome<number, ChatFailure> => failed(agentDidNotStart),
    );
    starting = beginning;
    const started = await beginning;
    if (started.ok && started.value > 0) return;
    state.phase = "idle";
    if (started.ok) return;
    log.put({
      kind: "notice",
      id: randomUUID(),
      text: started.failure.message,
    });
  };
  const parts: ChatParts = {
    projectFolder,
    store: options.store,
    serverCommand: options.serverCommand,
    programs,
    log,
    ledger,
    steering,
    state,
    onEnded: () => {
      startWaitingMessages().catch(() => undefined);
    },
  };
  const steer = (request: {
    text: string;
    details?: string | undefined;
    aboutClipId: string | undefined;
  }): Outcome<SteeringEntry, ChatFailure> => {
    const about = aboutOf({
      snapshot: options.store.read(),
      clipId: request.aboutClipId,
    });
    if (!about.ok) return about;
    return {
      ok: true,
      value: steering.add({
        text: request.text,
        details: request.details,
        about: about.value,
      }),
    };
  };
  const stop = () => {
    if (state.phase !== "running") return false;
    state.isStopRequested = true;
    helpers.stop();
    critics.stop();
    state.turn?.stop();
    return true;
  };
  startWaitingMessages().catch(() => undefined);
  return {
    view: () => chatViewOf({ programs, phase: state.phase, log }),
    startRequest: async (request) => {
      while (state.phase === "starting") await starting;
      if (state.phase !== "idle") return steer(request);
      state.phase = "starting";
      const beginning = beginPersonRequest({ parts, request }).catch(
        (): Outcome<RequestEntry, ChatFailure> => failed(agentDidNotStart),
      );
      starting = beginning;
      const started = await beginning;
      if (!started.ok) state.phase = "idle";
      return started;
    },
    stop,
    undoChange: (changeId) =>
      state.phase === "idle"
        ? undoChangeWith({ changeId, log, ledger, tracked })
        : Promise.resolve(failed(chatBusy)),
    noteAiCall: (tool) => state.tracker?.noteCall(tool) ?? noCallNote,
    runToolCall: tracked.runCall,
    leadCall: ({ tool, call }) =>
      state.phase === "running"
        ? steeredLeadCall({
            desk: steering,
            tool,
            call,
            onDelivered: () => state.tracker?.continueInNewAnswer(),
          })
        : call(),
    askHelper: (request) =>
      helpers.ask({
        request,
        lead: state.phase === "running" ? state.lead : undefined,
      }),
    askCritic: async (request) =>
      critics.ask({
        request,
        run:
          state.phase === "running"
            ? state.lead
            : await personCriticRun({
                isPerson: tracked.callerNow()?.by === "person",
                programs,
                serverCommand: options.serverCommand,
                projectFolder,
              }),
      }),
    helperCallOf: (token) => critics.callOf(token) ?? helpers.callOf(token),
    close: async () => {
      state.isClosing = true;
      stop();
      await state.running;
      await log.flush();
    },
  };
}
