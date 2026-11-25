import { z } from "zod";
import type { HarnessContext } from "../../context.js";
import { failureResult, successResult } from "../../results.js";
import { modelLimitsOf } from "./modelLimits.js";
import { shotBriefOf } from "./shotBriefLines.js";

const getShotBriefInput = {
  shot_id: z.string().describe("The shot of the story plan."),
  server: z
    .string()
    .optional()
    .describe(
      "The service that you will use for the clip. Leave it out for the default.",
    ),
  model: z
    .string()
    .optional()
    .describe(
      "The video model that you will use for the clip. Leave it out for the default.",
    ),
};

export function registerGetShotBrief(context: HarnessContext): void {
  context.tools.add({
    name: "get_shot_brief",
    description:
      "Everything that you need to write the prompts of one shot, for that shot only: the action, the camera, the states, the art direction, the facts, brief facts, restrictions, plan notes, and sheet pictures of each person, place, and prop of the shot, the plan notes of the shot, the prompts of the plan, the lessons of the film, the known limits that concern this kind of shot, and the limits of the picture and video models (references with a first frame, a last frame, the lengths). yumekit sends your prompt as you write it and adds nothing, so read this before the start picture and the clip of a shot, and write a complete prompt in your own words.",
    inputSchema: getShotBriefInput,
    annotations: { readOnlyHint: true },
    run: async ({ input }) => {
      const snapshot = context.store.read();
      const plan = snapshot.bible.storyPlan;
      const shot = plan?.shots.find(
        (candidate) => candidate.id === input.shot_id,
      );
      if (plan === undefined || shot === undefined) {
        return failureResult({
          kind: plan === undefined ? "story-plan-missing" : "shot-not-found",
          message:
            plan === undefined
              ? "This project has no story plan, so it has no shots."
              : `The story plan has no shot "${input.shot_id}".`,
          hint:
            plan === undefined
              ? "Write the plan with set_story_plan first."
              : `Use one of these shot ids: ${plan.shots.map((candidate) => candidate.id).join(", ")}.`,
        });
      }
      const brief = shotBriefOf({ snapshot, plan, shot });
      const models = await Promise.all([
        modelLimitsOf({
          mediaTools: context.mediaTools,
          capability: "image",
          server: undefined,
          model: undefined,
        }),
        modelLimitsOf({
          mediaTools: context.mediaTools,
          capability: "video",
          server: input.server,
          model: input.model,
        }),
      ]);
      const modelLines = models.flatMap((limits) => [
        `${limits.capability === "image" ? "Picture" : "Video"} model ${limits.model ?? "unknown"}:`,
        ...limits.lines.map((line) => `- ${line}`),
      ]);
      return successResult({
        line: [...brief.lines, ...modelLines].join("\n"),
        data: {
          ...brief.data,
          models: models.map((limits) => ({
            capability: limits.capability,
            model: limits.model ?? null,
            limits: limits.lines,
          })),
        },
      });
    },
  });
}
