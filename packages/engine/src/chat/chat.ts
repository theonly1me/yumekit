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
import { createAnswerTracker, type AnswerTracker } from "./answerTracker.js";
import { createChangeLedger } from "./changeLedger.js";
import type { Chat } from "./chatInterface.js";
import { chatBusy, failed, noServerCommand } from "./chatFailures.js";
import { createHelperDesk, type LeadRun } from "./helpers/helperDesk.js";
import { createCriticDesk, personCriticRun } from "./helpers/criticDesk.js";
import { loadChat } from "./chatFile.js";
import { createChatLog } from "./chatLog.js";
import type { AnswerEntry, ChatFailure, RequestEntry } from "./chatTypes.js";
import { runRequest, signInMessageOf } from "./requestRun.js";
import type { TrackedStore } from "./trackedStore.js";
import { noCallNote } from "./stepNotes.js";
import { undoChangeWith } from "./undoChange.js";

export type { Chat } from "./chatInterface.js";

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
  let tracker: AnswerTracker | undefined;
  let isStopRequested = false;
  let running: Promise<void> = Promise.resolve();
  let lead: LeadRun | undefined;
  const helpers = createHelperDesk();
  const critics = createCriticDesk();
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
    const answerTracker = createAnswerTracker({ log, answer });
    tracker = answerTracker;
    const { serverCommand } = options;
    lead = { adapter, serverCommand, projectFolder };
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
      tracker: answerTracker,
      serverCommand,
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
        tracker = undefined;
        lead = undefined;
      });
    return { ok: true, value: entry };
  };
  const stop = () => {
    if (phase !== "running") return false;
    isStopRequested = true;
    helpers.stop();
    critics.stop();
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
    noteAiCall: (tool) => tracker?.noteCall(tool) ?? noCallNote,
    runToolCall: tracked.runCall,
    askHelper: (request) =>
      helpers.ask({ request, lead: phase === "running" ? lead : undefined }),
    askCritic: async (request) =>
      critics.ask({
        request,
        run:
          phase === "running"
            ? lead
            : await personCriticRun({
                isPerson: tracked.callerNow()?.by === "person",
                programs,
                serverCommand: options.serverCommand,
                projectFolder,
              }),
      }),
    helperCallOf: (token) => critics.callOf(token) ?? helpers.callOf(token),
    close: async () => {
      stop();
      await running;
      await log.flush();
    },
  };
}
