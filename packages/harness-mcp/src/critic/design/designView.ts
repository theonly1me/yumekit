import type { Asset, AssetRegion } from "@yumekit/project";
import type { HarnessContext } from "../../context.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { pictureOf, type Content } from "../criticPictures.js";
import {
  designFrameSeconds,
  type DesignCropSeen,
  type DesignJob,
  type DesignMember,
} from "./designJob.js";

export interface DesignLook {
  cast_id: string;
  region?: AssetRegion | undefined;
  asset_id?: string | undefined;
  seconds?: number | undefined;
}

function notInCheck(failure: { message: string; hint: string }) {
  return Promise.resolve<Outcome<Content, HarnessFailure>>({
    ok: false,
    failure: { kind: "not-in-review", ...failure },
  });
}

function questionsText(entry: DesignMember): Content {
  return [
    {
      type: "text",
      text: `The questions for ${entry.member.name}: ${entry.questions
        .map((...[question, index]) => `${String(index + 1)}. ${question.text}`)
        .join(" ")}`,
    },
  ];
}

function cropOf(options: {
  context: HarnessContext;
  job: DesignJob;
  entry: DesignMember;
  look: DesignLook;
  picture: Asset | undefined;
}):
  | { seen: DesignCropSeen; content: Promise<Outcome<Content, HarnessFailure>> }
  | undefined {
  const { context, job, entry, look, picture } = options;
  const { target } = job;
  const beside =
    entry.turnaround === undefined
      ? undefined
      : {
          asset: entry.turnaround,
          label: `The turnaround of the look "${entry.look.id}": the design to match`,
        };
  if (target.kind === "clip") {
    const seconds = Math.min(
      look.seconds ?? 0,
      Math.max(0, target.lengthSeconds - designFrameSeconds),
    );
    return {
      seen: { castId: entry.member.id, assetId: undefined, seconds },
      content: pictureOf({
        context,
        asset: target.clip,
        label: `${entry.member.name}, enlarged`,
        region: look.region,
        fromSeconds: seconds,
        toSeconds: seconds + designFrameSeconds / 2,
        count: 1,
        beside,
      }),
    };
  }
  if (picture === undefined) return undefined;
  return {
    seen: { castId: entry.member.id, assetId: picture.id, seconds: undefined },
    content: pictureOf({
      context,
      asset: picture,
      label: `${entry.member.name} in "${picture.id}", enlarged`,
      region: look.region,
      beside,
    }),
  };
}

export async function designViewOf(options: {
  context: HarnessContext;
  job: DesignJob | undefined;
  look: DesignLook;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, job, look } = options;
  const entry = job?.members.find(
    (member) => member.member.id === look.cast_id,
  );
  if (job === undefined || entry === undefined) {
    return notInCheck({
      message: `"${look.cast_id}" is not a person of the design check.`,
      hint: `Look at one of: ${(job?.members ?? []).map((member) => member.member.id).join(", ") || "none"}.`,
    });
  }
  const pictures = job.target.kind === "pictures" ? job.target.pictures : [];
  const picture =
    pictures.find((candidate) => candidate.id === look.asset_id) ??
    (look.asset_id === undefined ? pictures[0] : undefined);
  const crop = cropOf({ context, job, entry, look, picture });
  if (crop === undefined) {
    return notInCheck({
      message: `"${look.asset_id ?? ""}" is not a picture of the design check.`,
      hint: `Give asset_id, one of: ${pictures.map((candidate) => candidate.id).join(", ")}.`,
    });
  }
  const cropped = await crop.content;
  if (!cropped.ok) return cropped;
  job.seen.push(crop.seen);
  return { ok: true, value: [...cropped.value, ...questionsText(entry)] };
}
