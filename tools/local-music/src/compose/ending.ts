import type { ArrangeRequest } from "./arrange.ts";
import { pitchesOf } from "./pitches.ts";
import type { Chord, Note } from "./score.ts";
import { energyAt } from "./timing.ts";

const chordParts = new Set(["pad", "keys", "pluck", "strings"]);

export function endingNotesOf(options: {
  request: ArrangeRequest;
  chord: Chord;
  keyRoot: number;
}): Note[] {
  const { style, timing, energy } = options.request;
  const startSeconds = timing.endHitSeconds;
  if (startSeconds === undefined) return [];
  const tailSeconds = timing.durationSeconds - startSeconds;
  const velocity = 0.62 + 0.38 * energyAt({ energy, share: 1 });
  return style.ending.flatMap((part) => {
    const symbol = chordParts.has(part) ? "c" : "0";
    return pitchesOf({
      style,
      part,
      symbol,
      chord: options.chord,
      keyRoot: options.keyRoot,
    }).map((pitch) => ({
      part,
      startSeconds,
      lengthSeconds: tailSeconds * 0.3,
      releaseSeconds: tailSeconds * 0.62,
      pitch,
      velocity,
    }));
  });
}
