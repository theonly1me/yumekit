import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { togetherResult } from "../work/together/togetherResult.js";
import { criticTurnsAtOnce } from "./criticDesk.js";

const reviewTools = ["review_start", "review_clip", "review_sheet"] as const;

const mostReviewsTogether = 8;

const reviewSeveralInput = {
  reviews: z
    .array(
      z.object({
        tool: z
          .enum(reviewTools)
          .describe("The review: review_start, review_clip, or review_sheet."),
        asset_id: z
          .string()
          .optional()
          .describe("review_start and review_clip: the picture or the clip."),
        shot_id: z
          .string()
          .optional()
          .describe("review_start and review_clip: its shot."),
        cast_id: z
          .string()
          .optional()
          .describe("review_sheet: the cast entry."),
        look_id: z
          .string()
          .optional()
          .describe("review_sheet: the look to check."),
        end_picture_asset_id: z
          .string()
          .optional()
          .describe("review_start: the end picture of the shot."),
      }),
    )
    .min(1)
    .max(mostReviewsTogether)
    .describe(
      `1 to ${String(mostReviewsTogether)} reviews of different work, each with the fields of its tool.`,
    ),
};

type ReviewRequest = z.infer<
  z.ZodObject<typeof reviewSeveralInput>
>["reviews"][number];

function inputOf(review: ReviewRequest): Record<string, string> {
  if (review.tool === "review_sheet") {
    return {
      cast_id: review.cast_id ?? "",
      ...(review.look_id === undefined ? {} : { look_id: review.look_id }),
    };
  }
  return {
    asset_id: review.asset_id ?? "",
    shot_id: review.shot_id ?? "",
    ...(review.tool === "review_start" &&
    review.end_picture_asset_id !== undefined
      ? { end_picture_asset_id: review.end_picture_asset_id }
      : {}),
  };
}

function idOf(review: ReviewRequest): string {
  return review.tool === "review_sheet"
    ? (review.cast_id ?? "")
    : (review.asset_id ?? "");
}

export function registerReviewSeveral(context: HarnessContext): void {
  context.tools.add({
    name: "review_several",
    description: `Run several reviews of different work at the same time and wait for all of them, for example the start pictures of all free shots, or their clips. Each review is review_start, review_clip, or review_sheet with its fields, and keeps all its rules. The critic looks at up to ${String(criticTurnsAtOnce)} at once, and the rest wait for a free place. The same work never gets two reviews at once. Each review answers on its own.`,
    inputSchema: reviewSeveralInput,
    run: async ({ input, onProgress }) => {
      const tools = context.tools.tools();
      let doneCount = 0;
      const total = input.reviews.length;
      const results = await Promise.all(
        input.reviews.map(async (review) => {
          const tool = tools.find(
            (candidate) => candidate.name === review.tool,
          );
          const result =
            tool === undefined
              ? failureResult({
                  kind: "no-critic",
                  message: `The harness has no ${review.tool}.`,
                  hint: "Open the project in the editor so a critic can look.",
                })
              : await tool.run({ input: inputOf(review) });
          doneCount += 1;
          onProgress?.({
            done: doneCount,
            total,
            message: `${String(doneCount)} of ${String(total)} reviews done`,
          });
          return { id: idOf(review), result };
        }),
      );
      return togetherResult({ results, what: "reviews" });
    },
  });
}
