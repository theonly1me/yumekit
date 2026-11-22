import type { ProjectSnapshot, Timeline, Track } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findOutput } from "../lookups.js";
import {
  failureResult,
  type HarnessFailure,
  type Outcome,
} from "../results.js";

function trackWithOff(options: { track: Track; off: boolean }): Track {
  const { track } = options;
  const switched = options.off ? { off: true } : {};
  return track.kind === "scene"
    ? { id: track.id, kind: track.kind, clips: track.clips, ...switched }
    : { id: track.id, kind: track.kind, clips: track.clips, ...switched };
}

function timelinesWithTrack(options: {
  snapshot: ProjectSnapshot;
  trackId: string;
  outputIds: string[] | undefined;
}): Outcome<Timeline[], HarnessFailure> {
  const { snapshot, trackId } = options;
  const hasTrack = (timeline: Timeline) =>
    timeline.tracks.some((track) => track.id === trackId);
  const notFound = (outputIds: string[]): HarnessFailure => ({
    kind: "track-not-found",
    message: `The output ${outputIds.join(", ")} has no track "${trackId}".`,
    hint: "Call get_timeline and use the id of one of its tracks.",
  });
  if (options.outputIds === undefined) {
    const timelines = snapshot.timelines.filter(hasTrack);
    return timelines.length > 0
      ? { ok: true, value: timelines }
      : {
          ok: false,
          failure: notFound(
            snapshot.project.outputs.map((output) => output.id),
          ),
        };
  }
  const timelines: Timeline[] = [];
  for (const outputId of new Set(options.outputIds)) {
    const found = findOutput({ snapshot, outputId });
    if (!found.ok) return found;
    if (!hasTrack(found.value.timeline)) {
      return { ok: false, failure: notFound([outputId]) };
    }
    timelines.push(found.value.timeline);
  }
  return { ok: true, value: timelines };
}

export function registerSetTrackOff(context: HarnessContext): void {
  context.tools.add({
    name: "set_track_off",
    description:
      "Switch one track off or on. The preview and render_video skip a track that is off, for its pictures and its sound, and the video keeps its length. Use it to mute the music or to hide the captions without removing clips. get_timeline shows off for each track. One undo reverts the change in each output.",
    inputSchema: {
      output_ids: z
        .array(idInput("The id of an output."))
        .min(1)
        .optional()
        .describe(
          "The outputs to change. Default: each output that has a track with track_id.",
        ),
      track_id: idInput("The id of the track, from get_timeline."),
      off: z.boolean().describe("true switches the track off, false on."),
    },
    run: ({ input }) => {
      const timelines = timelinesWithTrack({
        snapshot: context.store.read(),
        trackId: input.track_id,
        outputIds: input.output_ids,
      });
      if (!timelines.ok) return failureResult(timelines.failure);
      return applyEditsResult({
        store: context.store,
        edits: timelines.value.map((timeline) => ({
          kind: "setTimeline",
          timeline: {
            ...timeline,
            tracks: timeline.tracks.map((track) =>
              track.id === input.track_id
                ? trackWithOff({ track, off: input.off })
                : track,
            ),
          },
        })),
        line: `Track "${input.track_id}" is ${input.off ? "off" : "on"} in ${timelines.value.map((timeline) => timeline.outputId).join(", ")}.`,
        data: {
          output_ids: timelines.value.map((timeline) => timeline.outputId),
          track_id: input.track_id,
          off: input.off,
        },
      });
    },
  });
}
