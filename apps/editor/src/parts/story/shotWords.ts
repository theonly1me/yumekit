import type { ShotState } from "./storyPlanSchema.js";

const sideWords: Record<string, string> = {
  left: "on the left",
  center: "in the middle",
  right: "on the right",
  off: "out of the picture",
};

const facingWords: Record<string, string> = {
  camera: "faces us",
  away: "faces away",
  left: "faces left",
  right: "faces right",
};

export function stateLinesOf(options: {
  state: ShotState;
  nameOf: (castId: string) => string;
}): string[] {
  const { state, nameOf } = options;
  if (typeof state === "string") return [state];
  return state.map((entry) => {
    const count = entry.count === undefined ? "" : ` (${String(entry.count)})`;
    const held =
      entry.heldBy === undefined
        ? ""
        : `, in the ${entry.heldBy.hand === "both" ? "two hands" : `${entry.heldBy.hand} hand`} of ${nameOf(entry.heldBy.castId)}`;
    const enters =
      entry.entersFrom === undefined ? "" : ` Comes from ${entry.entersFrom}.`;
    return `${nameOf(entry.castId)}${count}: ${entry.state}, ${entry.where}, ${sideWords[entry.screen] ?? entry.screen}, ${facingWords[entry.facing] ?? entry.facing}${held}.${enters}`;
  });
}

export function intensityText(
  intensity: number | undefined,
): string | undefined {
  if (intensity === undefined) return undefined;
  const words = ["", "quiet", "low", "rising", "strong", "the peak"];
  return `Music: ${words[intensity] ?? String(intensity)}`;
}
