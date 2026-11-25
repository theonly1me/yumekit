import type { Asset, ProjectSnapshot, Shot } from "@yumekit/project";
import type { HarnessFailure, Outcome } from "../../results.js";
import {
  requiredSecondsOf,
  shotDesignJobOf,
  type DesignJob,
} from "./designJob.js";

export interface DesignTargetOfShot {
  shot: Shot;
  asset: Asset;
  jobOf: (
    flagged: { seconds?: number | undefined; kind: string }[],
  ) => DesignJob | undefined;
}

export function designTargetOf(options: {
  snapshot: ProjectSnapshot;
  input: { asset_id: string; shot_id: string };
}): Outcome<DesignTargetOfShot, HarnessFailure> {
  const { snapshot, input } = options;
  const shot = snapshot.bible.storyPlan?.shots.find(
    (candidate) => candidate.id === input.shot_id,
  );
  const asset = snapshot.assets.find(
    (candidate) =>
      candidate.id === input.asset_id &&
      (candidate.kind === "image" || candidate.kind === "video"),
  );
  if (shot === undefined || asset === undefined) {
    return {
      ok: false,
      failure: {
        kind: "not-found",
        message: `The plan has no shot "${input.shot_id}", or the project has no picture or clip "${input.asset_id}".`,
        hint: "Give a picture or a clip of a shot of the story plan, and its shot.",
      },
    };
  }
  const lengthSeconds =
    (asset.durationFrames ?? 0) / snapshot.project.framesPerSecond;
  return {
    ok: true,
    value: {
      shot,
      asset,
      jobOf: (flagged) =>
        shotDesignJobOf({
          snapshot,
          castIds: shot.castIds,
          castLooks: shot.castLooks,
          target:
            asset.kind === "video"
              ? {
                  kind: "clip",
                  clip: asset,
                  lengthSeconds,
                  seconds: requiredSecondsOf({ lengthSeconds, flagged }),
                }
              : { kind: "pictures", pictures: [asset] },
        }),
    },
  };
}
