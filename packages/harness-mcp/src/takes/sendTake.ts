import {
  takeTextLimit,
  type ProjectStore,
  type Take,
  type TakeNote,
} from "@yumekit/project";
import { z } from "zod";
import type { HarnessFailure, Outcome } from "../results.js";
import { sentRequestOf, type SentRequest } from "./sentRequest.js";
import { takeApprovalEdits } from "./takeApprovals.js";

export const takeNoteInput = z
  .strictObject({
    item_id: z.string().min(1).max(64),
    text: z.string().trim().max(takeTextLimit).default(""),
    pin: z
      .strictObject({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      })
      .optional(),
    seconds: z.number().min(0).optional(),
    quote: z.string().trim().min(1).max(takeTextLimit).optional(),
    dropped: z.literal(true).optional(),
  })
  .refine((note) => note.text !== "" || note.dropped === true, {
    message: "A note needs text, unless it drops the item.",
  });

export type TakeNoteInput = z.infer<typeof takeNoteInput>;

export interface SentTake extends SentRequest {
  take: Take;
}

export type SendTakeFailure = HarnessFailure & {
  kind: "take-not-found" | "take-not-ready" | "note-not-valid";
};

function noteOf(input: TakeNoteInput): TakeNote {
  return {
    itemId: input.item_id,
    text: input.text,
    ...(input.pin === undefined ? {} : { pin: input.pin }),
    ...(input.seconds === undefined ? {} : { seconds: input.seconds }),
    ...(input.quote === undefined ? {} : { quote: input.quote }),
    ...(input.dropped === undefined ? {} : { dropped: input.dropped }),
  };
}

export async function sendTake(options: {
  store: ProjectStore;
  takeId: string;
  notes: TakeNoteInput[];
}): Promise<Outcome<SentTake, SendTakeFailure>> {
  const { store, takeId } = options;
  const snapshot = store.read();
  const take = snapshot.takes.find((candidate) => candidate.id === takeId);
  if (take === undefined) {
    return {
      ok: false,
      failure: {
        kind: "take-not-found",
        message: `The project has no take "${takeId}".`,
        hint: "Read the takes again.",
      },
    };
  }
  if (take.state !== "ready") {
    return {
      ok: false,
      failure: {
        kind: "take-not-ready",
        message: `Take ${String(take.number)} is ${take.state === "open" ? "still being made" : "already sent"}.`,
        hint: "Send a take when it is ready.",
      },
    };
  }
  const notes = options.notes.map(noteOf);
  const applied = await store.applyChange({
    by: "person",
    edits: [
      { kind: "sendTake", takeId, notes, at: new Date().toISOString() },
      ...takeApprovalEdits({
        snapshot,
        take,
        notedIds: new Set(notes.map((note) => note.itemId)),
      }),
    ],
  });
  if (!applied.ok) {
    return {
      ok: false,
      failure: {
        kind: "note-not-valid",
        message: applied.failure.message,
        hint: "Mark only the items of this take or of an earlier take of its step.",
      },
    };
  }
  const after = store.read();
  const sent = after.takes.find((candidate) => candidate.id === takeId);
  if (sent === undefined) throw new Error(`The sent take ${takeId} is gone.`);
  return {
    ok: true,
    value: { take: sent, ...sentRequestOf({ snapshot: after, take: sent }) },
  };
}
