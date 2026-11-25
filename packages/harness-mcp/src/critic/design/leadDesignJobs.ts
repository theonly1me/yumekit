import { join } from "node:path";
import type { Asset, Shot } from "@yumekit/project";
import { measureClipMotion } from "@yumekit/render";
import type { HarnessContext } from "../../context.js";
import { renderFailureOf } from "../../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import type { DesignTargetInput } from "./checkDesignInput.js";
import type { DesignCropSeen, DesignJob } from "./designJob.js";
import { designTargetOf } from "./designTarget.js";

export interface LeadDesignJob {
  shot: Shot;
  asset: Asset;
  job: DesignJob;
}

async function leadJobOf(options: {
  context: HarnessContext;
  target: DesignTargetInput;
  seenByAsset: Map<string, DesignCropSeen[]>;
}): Promise<Outcome<LeadDesignJob, HarnessFailure>> {
  const { context, seenByAsset } = options;
  const target = designTargetOf({
    snapshot: context.store.read(),
    input: options.target,
  });
  if (!target.ok) return target;
  const { shot, asset } = target.value;
  const motion =
    asset.kind === "video"
      ? await measureClipMotion({
          file: join(context.store.folder, asset.file),
        })
      : undefined;
  if (motion !== undefined && !motion.ok) {
    return { ok: false, failure: renderFailureOf(motion.failure) };
  }
  const built = target.value.jobOf(motion?.value.warnings ?? []);
  if (built === undefined) {
    return {
      ok: false,
      failure: {
        kind: "no-design",
        message: `No person of shot "${shot.id}" has a look with facts, so the design check of "${asset.id}" has nothing to compare. Its clip needs no design check.`,
        hint: "Leave it out of check_design. To check it anyway, give each person base facts and looks with put_cast_member.",
      },
    };
  }
  const seen = seenByAsset.get(asset.id) ?? [];
  seenByAsset.set(asset.id, seen);
  return { ok: true, value: { shot, asset, job: { ...built, seen } } };
}

export async function leadDesignJobsOf(options: {
  context: HarnessContext;
  targets: DesignTargetInput[];
  seenByAsset: Map<string, DesignCropSeen[]>;
}): Promise<Outcome<LeadDesignJob[], HarnessFailure>> {
  const jobs: LeadDesignJob[] = [];
  for (const target of options.targets) {
    const job = await leadJobOf({ ...options, target });
    if (!job.ok) return job;
    jobs.push(job.value);
  }
  return { ok: true, value: jobs };
}
