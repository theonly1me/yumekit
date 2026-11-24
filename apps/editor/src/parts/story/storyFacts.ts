import { findCameraMove } from "@yumekit/project/camera-moves";
import type { Asset, Snapshot } from "../../engine/snapshot.js";
import type { PlanShot, ShotReview } from "./storyPlanSchema.js";

const warningWords: Record<string, string> = {
  "almost-still": "Almost nothing moves",
  "only-camera-moves": "Only the camera moves",
  "still-background": "The background does not move",
  "hard-jump": "The picture jumps",
  "sudden-change": "A part of the picture changes suddenly",
  "does-not-start-on-the-start-picture": "It does not start on its picture",
};

const sizeWords: Record<string, string> = {
  wide: "Wide shot",
  full: "Full shot",
  medium: "Medium shot",
  "close-up": "Close up",
  "extreme-close-up": "Very close up",
};

const angleWords: Record<string, string> = {
  "eye-level": "at eye level",
  low: "from low",
  high: "from high",
  overhead: "from above",
  "over-the-shoulder": "over the shoulder",
};

const lensWords: Record<string, string> = {
  wide: "wide lens",
  normal: "normal lens",
  long: "long lens",
};

export interface ShotFacts {
  number: number;
  shot: PlanShot;
  placeName: string;
  cameraText: string;
  lengthText: string;
  startPicture: Asset | undefined;
  endPicture: Asset | undefined;
  clip: Asset | undefined;
  verdictText: string;
  verdict: ShotReview["verdict"] | "none";
  faults: string[];
  missed: string[];
  warnings: string[];
}

function shotIdOf(asset: Asset): unknown {
  return asset.source.kind === "tool"
    ? asset.source.input["shot_id"]
    : undefined;
}

function secondsText(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return rounded === 1 ? "1 second" : `${String(rounded)} seconds`;
}

function verdictTextOf(options: {
  clip: Asset | undefined;
  review: ShotReview | undefined;
}): string {
  const { clip, review } = options;
  if (clip === undefined) return "No clip yet.";
  if (review === undefined) return "Made. The critic checks it next.";
  if (review.by !== "critic") {
    return "Not checked by the critic. The AI checked its own clip.";
  }
  if (review.verdict === "keep") return "The critic kept it.";
  if (review.verdict === "redo") {
    return "The critic failed it. The AI makes it again.";
  }
  const from = review.keepFromSeconds ?? 0;
  const to = review.keepToSeconds ?? 0;
  return `The critic kept ${String(from)} to ${String(to)} seconds.`;
}

function cameraTextOf(shot: PlanShot): string {
  const size = sizeWords[shot.camera.size] ?? shot.camera.size;
  const angle = angleWords[shot.camera.angle] ?? shot.camera.angle;
  const lens =
    shot.camera.lens === undefined
      ? undefined
      : (lensWords[shot.camera.lens] ?? shot.camera.lens);
  const move =
    shot.camera.move === undefined
      ? undefined
      : findCameraMove(shot.camera.move)?.name;
  return [`${size} ${angle}`, lens, move]
    .filter((part) => part !== undefined)
    .join(", ");
}

export function shotFactsOf(snapshot: Snapshot): ShotFacts[] {
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) return [];
  return plan.shots.map((...[shot, index]) => {
    const made = snapshot.assets.filter((asset) => shotIdOf(asset) === shot.id);
    const reviewedId = shot.reviews?.at(-1)?.assetId;
    const clip =
      made.findLast((asset) => asset.kind === "video") ??
      snapshot.assets.find((asset) => asset.id === reviewedId);
    const firstId =
      clip?.source.kind === "tool"
        ? clip.source.input["first_frame_asset_id"]
        : undefined;
    const startPicture =
      snapshot.assets.find((asset) => asset.id === firstId) ??
      made.findLast((asset) => asset.kind === "image");
    const review = (shot.reviews ?? []).findLast(
      (candidate) => candidate.assetId === clip?.id,
    );
    const earlierFaults = (shot.reviews ?? [])
      .filter((candidate) => candidate.verdict === "redo")
      .flatMap((candidate) => candidate.faults);
    return {
      number: index + 1,
      shot,
      placeName:
        snapshot.bible.cast.find((member) => member.id === shot.placeId)
          ?.name ?? "A place that is not in the cast yet",
      cameraText: cameraTextOf(shot),
      lengthText: secondsText(shot.seconds),
      startPicture,
      endPicture: snapshot.assets.find(
        (asset) => asset.id === review?.endPictureAssetId,
      ),
      clip,
      verdictText: verdictTextOf({ clip, review }),
      verdict: review?.verdict ?? "none",
      faults: [...new Set([...earlierFaults, ...(review?.faults ?? [])])],
      missed: review?.critic?.missed ?? [],
      warnings: [
        ...new Set(
          (review?.measures.warnings ?? []).map(
            (warning) => warningWords[warning] ?? warning,
          ),
        ),
      ],
    };
  });
}
