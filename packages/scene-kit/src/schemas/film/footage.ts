import { z } from "zod";
import {
  filmAccent,
  filmHeading,
  filmStartSeconds,
  optionalMark,
  optionalRegion,
} from "./shared.js";

export const footageLimits = { stops: 4, speed: 4 } as const;

export const footageWindows = ["plain", "none"] as const;

export const footageStop = z
  .strictObject({
    region: optionalRegion(),
    mark: optionalMark(),
    beat: z
      .number()
      .min(0)
      .optional()
      .describe(
        "The beat of the scene at which the view arrives at this stop. Needs a tempo.",
      ),
    seconds: z
      .number()
      .min(0)
      .optional()
      .describe(
        "The second of the scene at which the view arrives at this stop, when the project has no tempo.",
      ),
  })
  .describe(
    "A stop of the camera: a region or a mark, and when the view arrives there. Without a time, the stops spread evenly over the scene.",
  );

export const footageSchema = {
  purpose:
    "One screen recording, video, or picture, cut to the region that matters and shown large, in a plain window, with an optional headline. Use a region or a mark so that small text in a recording reads on a phone. With stops, the view moves from region to region on the beat.",
  props: z.strictObject({
    heading: filmHeading,
    accent: filmAccent,
    assetId: z
      .string()
      .min(1)
      .describe(
        "The id of a video or an image asset in the project, for example a screen recording. If the asset is missing, the window shows a plain placeholder.",
      )
      .meta({ assetKinds: ["video", "image"] }),
    region: optionalRegion(),
    mark: optionalMark(),
    startSeconds: filmStartSeconds,
    speed: z
      .number()
      .min(0.25)
      .max(footageLimits.speed)
      .optional()
      .describe(
        "How fast the video plays, from 0.25 to 4. The default is 1. Use 1.5 to 2 for a long recording in a short scene.",
      ),
    stops: z
      .array(footageStop)
      .min(2)
      .max(footageLimits.stops)
      .optional()
      .describe(
        "2 to 4 camera stops. They replace region. Keep them few: one move in a scene reads, three moves tire the eye.",
      )
      .meta({ title: "Camera stops" }),
    window: z
      .enum(footageWindows)
      .optional()
      .describe(
        "plain draws a thin edge and round corners around the footage. none shows it with no edge. The default is plain.",
      ),
  }),
};
