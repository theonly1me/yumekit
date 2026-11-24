import type { Asset, AssetRegion } from "@yumekit/project";
import type { HarnessContext } from "../../context.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import {
  criticFramesPerSecond,
  denseWindowsOf,
  joinedContent,
  pictureOf,
  type Content,
} from "../criticPictures.js";
import type { ClipJob } from "./clipJob.js";

export interface CriticLook {
  asset_id?: string | undefined;
  region?: AssetRegion | undefined;
  from_seconds?: number | undefined;
  to_seconds?: number | undefined;
}

function sheetPicturesOf(job: ClipJob): Asset[] {
  return job.members.flatMap((member) =>
    member.referenceAssetIds.flatMap((id) => {
      const asset = job.pictures.find((candidate) => candidate.id === id);
      return asset === undefined ? [] : [asset];
    }),
  );
}

export function lookableOf(job: ClipJob): Asset[] {
  return [
    job.clip,
    ...(job.startPicture === undefined ? [] : [job.startPicture]),
    ...(job.previousEnd === undefined ? [] : [job.previousEnd]),
    ...sheetPicturesOf(job),
  ];
}

function wholeViewOf(options: {
  context: HarnessContext;
  job: ClipJob;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, job } = options;
  const frames = denseWindowsOf({
    fromSeconds: 0,
    toSeconds: job.lengthSeconds,
  }).map((window) =>
    pictureOf({
      context,
      asset: job.clip,
      label: `The clip from ${String(window.fromSeconds)}s to ${String(window.toSeconds)}s`,
      ...window,
    }),
  );
  const start =
    job.startPicture === undefined
      ? []
      : [
          pictureOf({
            context,
            asset: job.startPicture,
            label: `The start picture "${job.startPicture.id}": the first frame must match it`,
          }),
          pictureOf({
            context,
            asset: job.clip,
            label: "The first frame of the clip",
            fromSeconds: 0,
            toSeconds: 1 / criticFramesPerSecond,
            count: 1,
          }),
        ];
  const before =
    job.previousEnd === undefined
      ? []
      : [
          pictureOf({
            context,
            asset: job.previousEnd,
            label: `The end of the shot before ("${job.previousEnd.id}"): the screen side and facing of each character carry across the cut`,
          }),
        ];
  const sheets = sheetPicturesOf(job).map((asset) =>
    pictureOf({ context, asset, label: `The sheet picture "${asset.id}"` }),
  );
  return joinedContent([...frames, ...start, ...before, ...sheets]);
}

export function clipViewOf(options: {
  context: HarnessContext;
  job: ClipJob;
  look: CriticLook;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, job, look } = options;
  const isWhole =
    look.asset_id === undefined &&
    look.region === undefined &&
    look.from_seconds === undefined &&
    look.to_seconds === undefined;
  if (isWhole) return wholeViewOf({ context, job });
  const asset = lookableOf(job).find(
    (candidate) => candidate.id === (look.asset_id ?? job.clip.id),
  );
  if (asset === undefined) {
    return Promise.resolve({
      ok: false,
      failure: {
        kind: "not-in-review",
        message: `"${look.asset_id ?? ""}" is not part of this review.`,
        hint: `Look at one of: ${lookableOf(job)
          .map((candidate) => candidate.id)
          .join(", ")}.`,
      },
    });
  }
  const fromSeconds = look.from_seconds ?? 0;
  const toSeconds = Math.min(
    look.to_seconds ?? job.lengthSeconds,
    job.lengthSeconds,
  );
  const span = Math.max(0, toSeconds - fromSeconds);
  return pictureOf({
    context,
    asset,
    label: `A closer look at "${asset.id}"`,
    region: look.region,
    ...(asset.kind === "video"
      ? {
          fromSeconds,
          toSeconds,
          count: Math.min(
            24,
            Math.max(1, Math.round(span * criticFramesPerSecond)),
          ),
        }
      : {}),
  });
}
