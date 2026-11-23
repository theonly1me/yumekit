import {
  beatFramesOfSpan,
  frameOfBeat,
  framesPerBeatOf,
  type TempoGrid,
} from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../results.js";
import { beatTwins, type BeatTwin } from "./beatTwins.js";

type Converted = Outcome<unknown, HarnessFailure>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function placeOf(path: string): string {
  return path === "" ? "" : ` in ${path}`;
}

function bothUnits(options: { twin: BeatTwin; path: string }): HarnessFailure {
  const { twin, path } = options;
  return {
    kind: "frames-and-beats",
    message: `The call gives both ${twin.frameKey} and ${twin.beatKey}${placeOf(path)}. One time takes one unit.`,
    hint: `Give ${twin.frameKey} in frames or ${twin.beatKey} in beats, not both.`,
  };
}

function noTempo(options: { twin: BeatTwin; path: string }): HarnessFailure {
  return {
    kind: "no-tempo",
    message: `${options.twin.beatKey}${placeOf(options.path)} is in beats, but the project has no tempo.`,
    hint: `Call set_tempo with the beats each minute of the music first, or give ${options.twin.frameKey} in frames.`,
  };
}

function frameValueOf(options: {
  twin: BeatTwin;
  beats: number;
  startBeat: unknown;
  grid: TempoGrid;
}): number {
  const { twin, beats, startBeat, grid } = options;
  if (!twin.isLength) return frameOfBeat({ grid, beat: beats });
  return typeof startBeat === "number"
    ? beatFramesOfSpan({ grid, startBeat, durationBeats: beats }).durationFrames
    : Math.max(1, Math.round(beats * framesPerBeatOf(grid)));
}

function convertObject(options: {
  value: Record<string, unknown>;
  grid: TempoGrid | undefined;
  path: string;
}): Converted {
  const { value, grid, path } = options;
  const frames: Record<string, number> = {};
  for (const twin of beatTwins) {
    const beats = value[twin.beatKey];
    if (beats === undefined) continue;
    if (value[twin.frameKey] !== undefined) {
      return { ok: false, failure: bothUnits({ twin, path }) };
    }
    if (grid === undefined) {
      return { ok: false, failure: noTempo({ twin, path }) };
    }
    if (typeof beats === "number") {
      frames[twin.frameKey] = frameValueOf({
        twin,
        beats,
        startBeat: value["start_beat"],
        grid,
      });
    }
  }
  const beatKeys = new Set(beatTwins.map((twin) => twin.beatKey));
  const withoutBeats = Object.fromEntries(
    Object.entries(value).filter(([key]) => !beatKeys.has(key)),
  );
  return convertEntries({ value: { ...withoutBeats, ...frames }, grid, path });
}

function convertEntries(options: {
  value: Record<string, unknown>;
  grid: TempoGrid | undefined;
  path: string;
}): Converted {
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(options.value)) {
    const converted = framesOfBeats({
      input: inner,
      grid: options.grid,
      path: options.path === "" ? key : `${options.path}.${key}`,
    });
    if (!converted.ok) return converted;
    result[key] = converted.value;
  }
  return { ok: true, value: result };
}

export function framesOfBeats(options: {
  input: unknown;
  grid: TempoGrid | undefined;
  path?: string;
}): Converted {
  const { input, grid } = options;
  const path = options.path ?? "";
  if (Array.isArray(input)) {
    const items: unknown[] = [];
    for (const [index, item] of input.entries()) {
      const converted = framesOfBeats({
        input: item,
        grid,
        path: `${path}[${String(index)}]`,
      });
      if (!converted.ok) return converted;
      items.push(converted.value);
    }
    return { ok: true, value: items };
  }
  return isRecord(input)
    ? convertObject({ value: input, grid, path })
    : { ok: true, value: input };
}
