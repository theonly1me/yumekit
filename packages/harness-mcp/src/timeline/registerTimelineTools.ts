import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { registerClipTools } from "./registerClipTools.js";
import { trackOf, wireTrack } from "./wireTimeline.js";

function registerSetTimeline(context: HarnessContext): void {
  context.server.registerTool(
    "set_timeline",
    {
      description:
        "Replace all tracks and clips of one output in one call. Use it for a first build. Scene tracks draw in list order: the first is at the back, so put captions on the last scene track. A scene clip shows a scene; an audio clip plays an audio asset. Clips on one track must not overlap. The video ends at the last clip end.",
      inputSchema: {
        output_id: idInput("The id of the output."),
        tracks: z.array(wireTrack).describe("All tracks, back to front."),
      },
    },
    ({ output_id, tracks }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setTimeline",
            timeline: { outputId: output_id, tracks: tracks.map(trackOf) },
          },
        ],
        line: `Timeline of "${output_id}" set with ${String(tracks.length)} tracks.`,
      }),
  );
}

function registerRemoveClip(context: HarnessContext): void {
  context.server.registerTool(
    "remove_clip",
    {
      description: "Remove one clip from a timeline. undo brings it back.",
      inputSchema: {
        output_id: idInput("The id of the output."),
        clip_id: idInput("The id of the clip from get_timeline."),
      },
      annotations: { destructiveHint: true },
    },
    ({ output_id, clip_id }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "removeClip", outputId: output_id, clipId: clip_id }],
        line: `Clip "${clip_id}" removed.`,
      }),
  );
}

function registerCopyTimeline(context: HarnessContext): void {
  context.server.registerTool(
    "copy_timeline",
    {
      description:
        "Replace the timeline of one output with a copy of another. Use it to make a tall or square version of a finished wide timeline, then change it. The copy keeps the track ids and the clip ids of the source, so a clip id names the same clip in both outputs. To show another scene in one output, call update_clip with the output_id of that output, the clip_id, and scene_id. Kit scenes adapt their layout to each size.",
      inputSchema: {
        from_output_id: idInput("The output to copy from."),
        to_output_id: idInput("The output whose timeline is replaced."),
      },
    },
    ({ from_output_id, to_output_id }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "copyTimeline",
            fromOutputId: from_output_id,
            toOutputId: to_output_id,
          },
        ],
        line: `Timeline of "${from_output_id}" copied to "${to_output_id}".`,
      }),
  );
}

export function registerTimelineTools(context: HarnessContext): void {
  registerSetTimeline(context);
  registerClipTools(context);
  registerRemoveClip(context);
  registerCopyTimeline(context);
}
