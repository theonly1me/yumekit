import { videoStyles } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { videoStyleMeanings } from "./videoStyleMeanings.js";

export function registerSetVideoStyle(context: HarnessContext): void {
  context.tools.add({
    name: "set_video_style",
    description: `Change how the video is made. The person picks the style, so call this only when the person asks. ${videoStyleMeanings} Video clips stay inside the limit of generated video. One call is one undo step.`,
    inputSchema: {
      video_style: z
        .enum(videoStyles)
        .describe("The new video style: graphics, ai-video, or mix."),
    },
    run: ({ input: { video_style } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "setVideoStyle", videoStyle: video_style }],
        line: `The video style is ${video_style}.`,
        data: { video_style },
      }),
  });
}
