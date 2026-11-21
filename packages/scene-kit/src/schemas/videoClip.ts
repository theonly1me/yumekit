import { z } from "zod";

export const videoClipLimits = { caption: 200 } as const;

const share = z.number().min(0).max(1);

export const videoClipSchema = {
  purpose:
    "One video asset that fills the picture, with an optional caption line of its own at the top. The clip is the motion, so the scene adds none. A clip that is longer than its video holds the last picture. The scene cuts a wide video in a tall output, so set focus to the subject.",
  props: z.strictObject({
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of a video asset in the project. If the asset is missing or is not a video, the scene shows a plain placeholder.",
      )
      .meta({ assetKind: "video" }),
    fit: z
      .enum(["cover", "contain"])
      .optional()
      .describe(
        "cover fills the picture and cuts the sides of the video that do not fit. contain shows the whole video with bars. The default is cover.",
      ),
    focus: z
      .strictObject({
        x: share.describe("From 0 (left edge) to 1 (right edge)."),
        y: share.describe("From 0 (top edge) to 1 (bottom edge)."),
      })
      .optional()
      .describe(
        "The point of the video that stays visible when cover cuts it, for example the face of the subject. The default is the center.",
      ),
    startSeconds: z
      .number()
      .min(0)
      .optional()
      .describe(
        "The second of the video that frame 0 of the scene shows. The default is 0.",
      ),
    caption: z
      .string()
      .max(videoClipLimits.caption)
      .optional()
      .describe(
        "An optional short caption of this scene, on a panel at the top of the picture. It is not the narration caption, which place_narration puts at the bottom.",
      ),
  }),
};
