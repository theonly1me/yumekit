import type { Snapshot } from "../../engine/snapshot.js";
import type { PlanShot } from "./storyPlanSchema.js";

export const shortestCleanSeconds = 1.2;

export interface DesignMark {
  mark: "clean" | "cut" | "break" | "kept";
  text: string;
  changes: string[];
}

function secondsText(seconds: number): string {
  return String(Math.round(seconds * 100) / 100);
}

export function designMarkOf(options: {
  shot: PlanShot;
  snapshot: Snapshot;
}): DesignMark | undefined {
  const checks = options.shot.designChecks ?? [];
  const isClip = (assetId: string) =>
    options.snapshot.assets.some(
      (asset) => asset.id === assetId && asset.kind === "video",
    );
  const clip = checks.filter((check) => isClip(check.assetId)).at(-1);
  const chosen = clip === undefined ? checks : [clip];
  if (chosen.length === 0) return undefined;
  const changes = chosen.flatMap((check) => check.breaks);
  const kept = chosen.find(
    (check) => check.breaks.length > 0 && check.personKept !== undefined,
  );
  if (kept?.personKept !== undefined) {
    return {
      mark: "kept",
      text: `Kept by you although the design changes: “${kept.personKept.words}”`,
      changes,
    };
  }
  if (changes.length === 0) {
    return { mark: "clean", text: "Same design all through.", changes };
  }
  const cleanUntil = clip?.cleanUntilSeconds;
  if (cleanUntil !== undefined && cleanUntil >= shortestCleanSeconds) {
    return {
      mark: "cut",
      text: `Same design until ${secondsText(cleanUntil)} seconds, then it changes. Only that part is used.`,
      changes,
    };
  }
  return {
    mark: "break",
    text: "The design changes, so this cannot be used.",
    changes,
  };
}

export function ShotDesign(props: {
  shot: PlanShot;
  snapshot: Snapshot;
  number: number;
}) {
  const { shot, snapshot } = props;
  const mark = designMarkOf({ shot, snapshot });
  const nameOf = (castId: string) =>
    snapshot.bible.cast.find((member) => member.id === castId);
  const looks = Object.entries(shot.castLooks ?? {}).map(([castId, lookId]) => {
    const member = nameOf(castId);
    const look = member?.looks?.find((entry) => entry.id === lookId);
    return `${member?.name ?? castId} wears ${look?.name ?? lookId}`;
  });
  return (
    <>
      {looks.length === 0 ? undefined : (
        <span className="fact">Looks: {looks.join(". ")}.</span>
      )}
      {mark === undefined ? undefined : (
        <span className="shot-design" data-mark={mark.mark}>
          {mark.text}
        </span>
      )}
      {mark === undefined || mark.changes.length === 0 ? undefined : (
        <ul
          className="shot-faults"
          aria-label={`What changes in the design in shot ${String(props.number)}`}
        >
          {mark.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
    </>
  );
}
