import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { tempoGridOf } from "@yumekit/project";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findOutput } from "../lookups.js";
import { failureResult } from "../results.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { beatOf } from "../tempo/beatFacts.js";
import { lengthFramesOf } from "../timeline/wireTimeline.js";
import { mostSheetFrames, sheetFramesOf } from "./sheetFrames.js";
import { sheetWarningsOf } from "./sheetWarnings.js";

const contactSheetInput = {
  output_id: idInput("The id of the output."),
  every_seconds: z
    .number()
    .min(0.1)
    .max(60)
    .optional()
    .describe(
      `The time between two frames of the sheet, in seconds. Default 1. A long video gets a larger step, so the sheet has at most ${String(mostSheetFrames)} frames.`,
    ),
  columns: z
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe(
      "Frames in each row. Default: a sheet about 1.6 times as wide as high.",
    ),
  beat_cuts: z
    .array(z.number().min(0).multipleOf(0.5))
    .max(64)
    .optional()
    .describe(
      "Beats where the video must cut on the beat, for example [8, 16, 24]. The sheet warns when a transition still runs at one of them. Needs a tempo (set_tempo).",
    ),
};

type ContactSheetInput = z.infer<z.ZodObject<typeof contactSheetInput>>;

async function contactSheet(options: {
  context: HarnessContext;
  input: ContactSheetInput;
}): Promise<CallToolResult> {
  const { context, input } = options;
  const snapshot = context.store.read();
  const found = findOutput({ snapshot, outputId: input.output_id });
  if (!found.ok) return failureResult(found.failure);
  if (
    input.beat_cuts !== undefined &&
    tempoGridOf(snapshot.project) === undefined
  ) {
    return failureResult({
      kind: "no-tempo",
      message: "beat_cuts is in beats, but the project has no tempo.",
      hint: "Call set_tempo first, or leave out beat_cuts.",
    });
  }
  const { framesPerSecond } = snapshot.project;
  const lengthFrames = lengthFramesOf(found.value.timeline);
  const picked = sheetFramesOf({
    lengthFrames,
    framesPerSecond,
    everySeconds: input.every_seconds ?? 1,
  });
  const sheet = await context.pictures.renderContactSheet({
    outputId: input.output_id,
    frames: picked.frames.length === 0 ? [0] : picked.frames,
    ...(input.columns === undefined ? {} : { columns: input.columns }),
  });
  if (!sheet.ok) return failureResult(renderFailureOf(sheet.failure));
  const warnings = sheetWarningsOf({
    snapshot,
    timeline: found.value.timeline,
    frames: sheet.value.frames,
    beatCuts: input.beat_cuts ?? [],
  });
  const frames = sheet.value.frames.map((frame) => {
    const beat = beatOf({ project: snapshot.project, frame: frame.frame });
    return {
      frame: frame.frame,
      seconds: Math.round((frame.frame / framesPerSecond) * 100) / 100,
      ...(beat === undefined ? {} : { beat }),
    };
  });
  const summary =
    warnings.length === 0
      ? "No warnings."
      : `${String(warnings.length)} warnings: ${warnings.map((warning) => warning.message).join(" ")}`;
  return {
    content: [
      {
        type: "text",
        text: `Contact sheet of "${input.output_id}": ${String(frames.length)} frames, one every ${String(picked.everySeconds)} seconds, left to right and top to bottom. Each frame shows its time, frame, and beat. ${summary}`,
      },
      {
        type: "image",
        data: Buffer.from(sheet.value.png).toString("base64"),
        mimeType: "image/png",
      },
    ],
    structuredContent: {
      output_id: input.output_id,
      every_seconds: picked.everySeconds,
      width_pixels: sheet.value.widthPixels,
      height_pixels: sheet.value.heightPixels,
      frames,
      warnings,
    },
  };
}

export function registerContactSheet(context: HarnessContext): void {
  context.tools.add({
    name: "contact_sheet",
    description:
      "Check the whole video in one picture: one frame every second (every_seconds), in rows, each with its time, frame, and beat. The result lists warnings: a frame that is one color, text that leaves the picture, a video that shows its first frame for a second or more, and a transition that still runs at a beat of beat_cuts. Frames with a warning have a red edge. Call it after each build of a timeline and before render_video, in place of many preview_frames calls. Then fix each warning and call it again.",
    inputSchema: contactSheetInput,
    annotations: { readOnlyHint: true },
    run: ({ input }) => contactSheet({ context, input }),
  });
}
