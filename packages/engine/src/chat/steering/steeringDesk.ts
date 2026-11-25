import { randomUUID } from "node:crypto";
import type { ChatLog } from "../chatLog.js";
import type { RequestAbout, SteeringEntry } from "../chatTypes.js";
import { personExtrasOf } from "../questions/personRequest.js";
import type { RequestFile } from "../questions/questionSchemas.js";

export interface SteeringDesk {
  add: (message: {
    text: string;
    details: string | undefined;
    about: RequestAbout | null;
    files: RequestFile[];
    roundId: string | undefined;
  }) => SteeringEntry;
  waiting: () => SteeringEntry[];
  take: () => SteeringEntry[];
}

export function createSteeringDesk(log: ChatLog): SteeringDesk {
  const waiting = () =>
    log
      .entries()
      .flatMap((entry) =>
        entry.kind === "steering" && entry.state === "waiting" ? [entry] : [],
      );
  return {
    add: (message) => {
      const entry: SteeringEntry = {
        kind: "steering",
        id: randomUUID(),
        text: message.text,
        ...(message.details === undefined ? {} : { details: message.details }),
        about: message.about,
        sentAt: new Date().toISOString(),
        state: "waiting",
        ...personExtrasOf(message),
      };
      log.put(entry);
      return entry;
    },
    waiting,
    take: () => {
      const taken = waiting();
      for (const entry of taken) log.put({ ...entry, state: "read" });
      return taken;
    },
  };
}
