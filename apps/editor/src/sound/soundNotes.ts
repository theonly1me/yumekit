import type { Snapshot } from "../engine/snapshot.js";
import type { AnswerEntry } from "../making/firstChat.js";
import {
  noMusicServiceText,
  stepWhyOf,
  type StepAction,
} from "../making/stepReasons.js";
import { isVoiceOld, oldVoiceText } from "./oldVoice.js";
import type { SoundPartName, SoundRow } from "./soundRowFacts.js";

export type SoundAction = StepAction | "record-the-voice-again";

export interface SoundNote {
  part: SoundPartName;
  trackId?: string;
  name: string;
  text: string;
  actions: SoundAction[];
}

const partNames: Record<SoundPartName, string> = {
  voice: "Voice",
  music: "Music",
};

function missingNoteOf(options: {
  part: SoundPartName;
  answer: AnswerEntry | undefined;
  musicIsReady: boolean;
}): SoundNote | undefined {
  const { part, answer, musicIsReady } = options;
  const why =
    answer === undefined || answer.state === "running"
      ? part === "music" && !musicIsReady
        ? {
            text: noMusicServiceText,
            actions: ["add-a-key", "use-my-own-music"] satisfies StepAction[],
          }
        : undefined
      : stepWhyOf({ stepId: part, answer, musicIsReady });
  return why === undefined
    ? undefined
    : { part, name: partNames[part], ...why };
}

export function soundNotesOf(options: {
  rows: SoundRow[];
  snapshot: Snapshot;
  answer: AnswerEntry | undefined;
  musicIsReady: boolean;
}): SoundNote[] {
  const { rows } = options;
  const hasPart = (part: SoundPartName) =>
    rows.some((row) => row.part === part);
  const notes: SoundNote[] = [];
  const voiceRow = rows.find((row) => row.part === "voice");
  if (voiceRow !== undefined && isVoiceOld(options.snapshot)) {
    notes.push({
      part: "voice",
      trackId: voiceRow.trackId,
      name: "",
      text: oldVoiceText,
      actions: ["record-the-voice-again"],
    });
  }
  for (const part of ["voice", "music"] as const) {
    if (hasPart(part)) continue;
    const note = missingNoteOf({ ...options, part });
    if (note !== undefined) notes.push(note);
  }
  return notes;
}
