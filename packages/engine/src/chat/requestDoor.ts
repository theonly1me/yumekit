import { randomUUID } from "node:crypto";
import type { Outcome } from "../engineTypes.js";
import { aboutOf } from "./aboutClip.js";
import { failed } from "./chatFailures.js";
import type { Chat } from "./chatInterface.js";
import type { ChatFailure, RequestEntry, SteeringEntry } from "./chatTypes.js";
import {
  personRequestOf,
  type PersonRequest,
} from "./questions/personRequest.js";
import type { QuestionDesk } from "./questions/questionDesk.js";
import {
  beginPersonRequest,
  beginSteeringRequest,
  type ChatParts,
} from "./requestStart.js";

const agentDidNotStart: ChatFailure = {
  kind: "no-agent",
  message: "The AI program did not start.",
};

export interface RequestDoor {
  startRequest: Chat["startRequest"];
  startWaitingMessages: () => Promise<void>;
}

export function createRequestDoor(options: {
  parts: ChatParts;
  questions: QuestionDesk;
}): RequestDoor {
  const { parts } = options;
  const { state, log } = parts;
  let starting: Promise<unknown> = Promise.resolve();
  const steer = (
    request: PersonRequest,
  ): Outcome<SteeringEntry, ChatFailure> => {
    const about = aboutOf({
      snapshot: parts.store.read(),
      clipId: request.aboutClipId,
    });
    if (!about.ok) return about;
    const entry = parts.steering.add({
      text: request.text,
      details: request.details,
      about: about.value,
      files: request.files,
      roundId: request.roundId,
    });
    request.closeRound();
    return { ok: true, value: entry };
  };
  return {
    startWaitingMessages: async () => {
      if (state.isClosing || state.phase !== "idle") return;
      if (parts.steering.waiting().length === 0) return;
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
    },
    startRequest: async (input) => {
      while (state.phase === "starting") await starting;
      const request = personRequestOf({
        snapshot: parts.store.read(),
        desk: options.questions,
        input,
      });
      if (!request.ok) return request;
      if (state.phase !== "idle") return steer(request.value);
      state.phase = "starting";
      const beginning = beginPersonRequest({
        parts,
        request: request.value,
      }).catch((): Outcome<RequestEntry, ChatFailure> =>
        failed(agentDidNotStart),
      );
      starting = beginning;
      const started = await beginning;
      if (!started.ok) state.phase = "idle";
      return started;
    },
  };
}
