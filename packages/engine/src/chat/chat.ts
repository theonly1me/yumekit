import { randomUUID } from "node:crypto";
import { noPersonFailure, type Harness } from "@yumekit/harness-mcp";
import type { ProjectStore } from "@yumekit/project";
import type { ServerCommand } from "../agents/agentTypes.js";
import type { EventHub } from "../events/eventHub.js";
import { createExportDesk } from "../exports/exportDesk.js";
import { findAgentPrograms } from "./agentChoice.js";
import { createChangeLedger } from "./changeLedger.js";
import type { Chat } from "./chatInterface.js";
import { chatBusy, failed } from "./chatFailures.js";
import { createHelperDesk } from "./helpers/helperDesk.js";
import { createCriticDesk, personCriticRun } from "./helpers/criticDesk.js";
import { loadChat } from "./chatFile.js";
import { createChatLog } from "./chatLog.js";
import { createMoneyDesk } from "./money/moneyDesk.js";
import { createPermissionDesk } from "./permissions/permissionDesk.js";
import { permissionWaitMilliseconds } from "./permissions/permissionReplies.js";
import {
  createQuestionDesk,
  questionsWaitingResult,
} from "./questions/questionDesk.js";
import { createRequestDoor } from "./requestDoor.js";
import type { ChatParts, RunState } from "./requestStart.js";
import { steeredLeadCall } from "./steering/steeredCall.js";
import { createSteeringDesk } from "./steering/steeringDesk.js";
import type { TrackedStore } from "./trackedStore.js";
import { noCallNote } from "./stepNotes.js";
import { undoChangeWith } from "./undoChange.js";
import { chatViewOf } from "./chatView.js";

export type { Chat } from "./chatInterface.js";

export async function createChat(options: {
  projectFolder: string;
  store: ProjectStore;
  tracked: TrackedStore;
  events: EventHub;
  harness: Harness;
  serverCommand: ServerCommand | undefined;
  permissionWaitMilliseconds?: number | undefined;
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
  const questions = createQuestionDesk(log);
  const state: RunState = {
    phase: "idle",
    turn: undefined,
    tracker: undefined,
    isStopRequested: false,
    isClosing: false,
    running: Promise.resolve(),
    lead: undefined,
  };
  const permissions = createPermissionDesk({
    log,
    projectFolder,
    waitMilliseconds:
      options.permissionWaitMilliseconds ?? permissionWaitMilliseconds,
    onAnswered: () => state.tracker?.continueInNewAnswer(),
  });
  const exports = createExportDesk({
    log,
    events: options.events,
    store: options.store,
    harness: options.harness,
    projectFolder,
  });
  const helpers = createHelperDesk();
  const critics = createCriticDesk({
    onNotice: (text) => {
      log.put({ kind: "notice", id: randomUUID(), text });
    },
  });
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
      permissions.endRequest();
      door.startWaitingMessages().catch(() => undefined);
    },
  };
  const door = createRequestDoor({ parts, questions });
  const stop = () => {
    if (state.phase !== "running") return false;
    state.isStopRequested = true;
    permissions.endRequest();
    helpers.stop();
    critics.stop();
    state.turn?.stop();
    return true;
  };
  const isLeadAtWork = () =>
    state.phase === "running" && tracked.callerNow()?.by === "ai";
  door.startWaitingMessages().catch(() => undefined);
  return {
    view: () => chatViewOf({ programs, phase: state.phase, log }),
    startRequest: door.startRequest,
    stop,
    undoChange: (changeId) =>
      state.phase === "idle"
        ? undoChangeWith({ changeId, log, ledger, tracked })
        : Promise.resolve(failed(chatBusy)),
    noteAiCall: (tool) => state.tracker?.noteCall(tool) ?? noCallNote,
    runToolCall: tracked.runCall,
    leadCall: ({ tool, call }) => {
      if (state.phase !== "running") return call();
      if (questions.openRound() !== undefined) {
        return Promise.resolve(questionsWaitingResult);
      }
      return steeredLeadCall({
        desk: steering,
        tool,
        call,
        onDelivered: () => state.tracker?.continueInNewAnswer(),
      });
    },
    askPerson: (asked) =>
      Promise.resolve(
        isLeadAtWork()
          ? { ok: true, roundId: questions.open(asked).id }
          : { ok: false, failure: noPersonFailure },
      ),
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
    money: createMoneyDesk({ log, startRequest: door.startRequest }),
    permissions: {
      ask: ({ call, isLead }) =>
        permissions.ask({
          call,
          isLeadAtWork: isLead && state.phase === "running",
        }),
      isRequestOn: () => state.phase !== "idle",
      checkFile: permissions.checkFile,
      answer: permissions.answer,
    },
    exports,
    close: async () => {
      state.isClosing = true;
      exports.close();
      stop();
      await state.running;
      await log.flush();
    },
  };
}
