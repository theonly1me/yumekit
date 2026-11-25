import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DesignCheck, Edit } from "@yumekit/project";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { failureResult, type HarnessFailure } from "../../results.js";
import { shortestCleanSeconds } from "../../storyPlan/designGate.js";
import { endPictureEditOf } from "../../storyPlan/endPicture.js";
import { designIssuesOf, type DesignFrameAnswer } from "./designAnswer.js";
import {
  designCheckOf,
  designChecksOf,
  designLineOf,
  withDesignChecks,
} from "./designRecord.js";
import type { LeadDesignJob } from "./leadDesignJobs.js";

function issuesFailure(issues: string[]): HarnessFailure {
  return {
    kind: "review-not-valid",
    message: `The answer is not whole: ${issues.join(" ")}`,
    hint: "Look again where you need to, and call again with the whole answer.",
  };
}

function framesOfJob(options: {
  entry: LeadDesignJob;
  frames: DesignFrameAnswer[];
  onlyAssetId: string | undefined;
}): DesignFrameAnswer[] {
  const { entry, onlyAssetId } = options;
  return options.frames.filter(
    (frame) => (frame.asset_id ?? onlyAssetId) === entry.asset.id,
  );
}

async function withEndPicture(options: {
  context: HarnessContext;
  entry: LeadDesignJob;
  check: DesignCheck;
}): Promise<{ check: DesignCheck; edits: Edit[]; failure?: HarnessFailure }> {
  const { context, entry, check } = options;
  const cleanUntil = check.cleanUntilSeconds;
  const isClip = entry.asset.kind === "video";
  if (!isClip || (cleanUntil ?? shortestCleanSeconds) < shortestCleanSeconds) {
    return { check, edits: [] };
  }
  const ending = await endPictureEditOf({
    snapshot: context.store.read(),
    projectFolder: context.store.folder,
    clip: entry.asset,
    seconds: cleanUntil,
  });
  if (!ending.ok) return { check, edits: [], failure: ending.failure };
  return {
    check: { ...check, endPictureAssetId: ending.value.assetId },
    edits: [ending.value.edit],
  };
}

export async function storeLeadChecks(options: {
  context: HarnessContext;
  jobs: LeadDesignJob[];
  frames: DesignFrameAnswer[];
}): Promise<CallToolResult> {
  const { context, jobs, frames } = options;
  const onlyAssetId = jobs.length === 1 ? jobs[0]?.asset.id : undefined;
  const issues = jobs.flatMap((entry) =>
    designIssuesOf({
      job: entry.job,
      frames: framesOfJob({ entry, frames, onlyAssetId }),
    }).map((issue) => `"${entry.asset.id}": ${issue}`),
  );
  if (issues.length > 0) return failureResult(issuesFailure(issues));
  const checked = jobs.find(
    (entry) =>
      designCheckOf({ shot: entry.shot, assetId: entry.asset.id })?.by ===
      "critic",
  );
  if (checked !== undefined) {
    return failureResult({
      kind: "critic-checked",
      message: `The critic already checked the design of "${checked.asset.id}".`,
      hint: "The check of the critic stays. Leave it out, or make a new picture or clip to check again.",
    });
  }
  const stored: { shotId: string; check: DesignCheck }[] = [];
  const endEdits: Edit[] = [];
  for (const entry of jobs) {
    const [check] = designChecksOf({
      job: entry.job,
      frames: framesOfJob({ entry, frames, onlyAssetId }),
      by: "lead",
    });
    if (check === undefined) continue;
    const ended = await withEndPicture({ context, entry, check });
    if (ended.failure !== undefined) return failureResult(ended.failure);
    stored.push({ shotId: entry.shot.id, check: ended.check });
    endEdits.push(...ended.edits);
  }
  const checks = stored.map((entry) => entry.check);
  return context.writeLatest(async () => {
    const latest = context.store.read().bible;
    const plan = latest.storyPlan;
    if (plan === undefined) throw new Error("A shot needs a plan.");
    const shots = plan.shots.map((shot) =>
      withDesignChecks({
        shot,
        checks: stored
          .filter((entry) => entry.shotId === shot.id)
          .map((entry) => entry.check),
      }),
    );
    return applyEditsResult({
      store: context.store,
      edits: [
        ...endEdits,
        {
          kind: "setBible",
          bible: { ...latest, storyPlan: { ...plan, shots } },
        },
      ],
      line: `${String(checks.length)} design ${checks.length === 1 ? "check" : "checks"} stored.${designLineOf(checks)}`,
      data: {
        checks: checks.map((check) => ({
          asset_id: check.assetId,
          design_breaks: check.breaks,
          ...(check.cleanUntilSeconds === undefined
            ? {}
            : { clean_until_seconds: check.cleanUntilSeconds }),
          ...(check.endPictureAssetId === undefined
            ? {}
            : { end_picture_asset_id: check.endPictureAssetId }),
        })),
        design_breaks: checks.flatMap((check) => check.breaks),
      },
    });
  });
}
