import type { StoryPlan } from "@yumekit/project";
import type { ShotPlacement } from "./shotPlacements.js";

export interface MapPart {
  name: string;
  fromSeconds: number;
  toSeconds: number;
  intensity: number;
  hits: number[];
}

const defaultIntensity = 3;

function rounded(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}

export function musicMapOf(options: {
  plan: StoryPlan;
  filmSeconds?: number;
  placements?: Map<string, ShotPlacement>;
}): MapPart[] {
  const parts: MapPart[] = [];
  let start = 0;
  for (const shot of options.plan.shots) {
    const placed = options.placements?.get(shot.id);
    const from = placed?.fromSeconds ?? start;
    const to = placed?.toSeconds ?? from + shot.seconds;
    parts.push({
      name: shot.id,
      fromSeconds: rounded(from),
      toSeconds: rounded(to),
      intensity: shot.musicIntensity ?? defaultIntensity,
      hits: (shot.musicHits ?? []).map((hit) => rounded(from + hit)),
    });
    start = Math.max(start, to);
  }
  const filmSeconds = options.filmSeconds ?? start;
  if (filmSeconds > start + 0.5) {
    parts.push({
      name: "end card",
      fromSeconds: rounded(start),
      toSeconds: rounded(filmSeconds),
      intensity: options.plan.musicEndIntensity ?? 1,
      hits: [],
    });
  }
  return parts;
}

export function cueSheetOf(parts: MapPart[]): string {
  return parts
    .map(
      (part) =>
        `[${String(part.fromSeconds)}s to ${String(part.toSeconds)}s] ${part.name}: intensity ${String(part.intensity)} of 5${part.hits.length === 0 ? "" : `, hits at ${part.hits.map((hit) => `${String(hit)}s`).join(", ")}`}`,
    )
    .join("\n");
}

export function intensityAt(options: {
  parts: MapPart[];
  seconds: number;
}): number {
  const part =
    options.parts.find(
      (candidate) =>
        options.seconds >= candidate.fromSeconds &&
        options.seconds < candidate.toSeconds,
    ) ?? options.parts.at(-1);
  return part?.intensity ?? defaultIntensity;
}
