import type { HarnessContext } from "../../context.js";
import { failureResult } from "../../results.js";
import { joinedContent, pictureOf, type Content } from "../criticPictures.js";
import { checkDesignInput, targetsOf } from "./checkDesignInput.js";
import { designBriefLinesOf } from "./designBrief.js";
import type { DesignCropSeen } from "./designJob.js";
import { designViewOf } from "./designView.js";
import { leadDesignJobsOf, type LeadDesignJob } from "./leadDesignJobs.js";
import { storeLeadChecks } from "./storeLeadChecks.js";

function briefOf(options: { context: HarnessContext; entry: LeadDesignJob }) {
  const { context, entry } = options;
  const { job, asset, shot } = entry;
  const lines = designBriefLinesOf({
    job,
    viewTool: "check_design",
    answerIn: "design of check_design",
  });
  return joinedContent([
    Promise.resolve<{ ok: true; value: Content }>({
      ok: true,
      value: [
        {
          type: "text",
          text: [`## "${asset.id}" of shot "${shot.id}"`, ...lines].join("\n"),
        },
      ],
    }),
    ...job.members.flatMap((member) =>
      member.turnaround === undefined
        ? []
        : [
            pictureOf({
              context,
              asset: member.turnaround,
              label: `The turnaround of ${member.member.name}, look "${member.look.id}"`,
            }),
          ],
    ),
    pictureOf({
      context,
      asset,
      label: `The ${asset.kind === "video" ? "clip" : "picture"} "${asset.id}"`,
    }),
  ]);
}

export function registerCheckDesign(context: HarnessContext): void {
  const seenByAsset = new Map<string, DesignCropSeen[]>();
  context.tools.add({
    name: "check_design",
    description:
      "The design check, run by you. Check a whole batch in one call: give assets (each picture or clip with its shot). Each person with a look must look exactly as the turnaround of the look of the shot: the same hair, each garment with its construction, each prop with its count and side. With assets (or asset_id and shot_id) only: the list of questions, the frames to answer, and the pictures. With asset_id, shot_id, cast_id, and region (and seconds for a clip): the enlarged crop next to the turnaround. With design: your answers, stored as one design check for each picture or clip. A no marks a break: a picture with a break cannot start or end a clip, and only the clean part of a clip can be placed, unless the person chooses it. A check of a clip saves the picture at the end of its clean part, for a shot that continues it. A check by the critic is never replaced.",
    inputSchema: checkDesignInput,
    run: async ({ input }) => {
      const targets = targetsOf(input);
      if (!targets.ok) return failureResult(targets.failure);
      const jobs = await leadDesignJobsOf({
        context,
        targets: targets.value,
        seenByAsset,
      });
      if (!jobs.ok) return failureResult(jobs.failure);
      if (input.design !== undefined) {
        return storeLeadChecks({
          context,
          jobs: jobs.value,
          frames: input.design,
        });
      }
      const [only] = jobs.value;
      if (input.cast_id !== undefined) {
        if (only === undefined || jobs.value.length > 1) {
          return failureResult({
            kind: "invalid-value",
            message: "A crop is of one picture or clip.",
            hint: "Give asset_id and shot_id with cast_id and region.",
          });
        }
        const view = await designViewOf({
          context,
          job: only.job,
          look: { ...input, cast_id: input.cast_id },
        });
        return view.ok ? { content: view.value } : failureResult(view.failure);
      }
      const briefs = await joinedContent(
        jobs.value.map((entry) => briefOf({ context, entry })),
      );
      if (!briefs.ok) return failureResult(briefs.failure);
      return { content: briefs.value };
    },
  });
}
