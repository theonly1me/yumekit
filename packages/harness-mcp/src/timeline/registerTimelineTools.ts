import type { Edit } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { registerClipTools } from "./registerClipTools.js";
import { keptLine, withKeptTransitions } from "./keptTransitions.js";
import {
  personWorkSentence,
  removePersonWorkInput,
} from "./personWorkInput.js";
import { trackOf, wireTrack, type WireTrack } from "./wireTimeline.js";

function transitionClipIdsOf(tracks: WireTrack[]): Set<string> {
  const ids = new Set<string>();
  for (const track of tracks) {
    if (track.kind !== "scene") continue;
    for (const clip of track.clips) {
      if (clip.id !== undefined && clip.transition !== undefined)
        ids.add(clip.id);
    }
  }
  return ids;
}

function registerSetTimeline(context: HarnessContext): void {
  context.tools.add({
    name: "set_timeline",
    description: `Replace all tracks and clips of one output in one call. Use it only for a new video, or when the person asks to build the video again. To record the voice again or to change it, call replace_narration. To change the music, call replace_music. Scene tracks draw in list order: the first is at the back, so put captions on the last scene track. A scene clip shows a scene; an audio clip plays an audio asset. Clips on one track must not overlap. The video ends at the last clip end. A scene clip can have a transition from the clip before it; set_transitions sets one kind for each scene in one call. A clip with the id of a clip that is there now keeps its transition when the call gives none; give the kind cut to remove it. The result gives kept_transitions. ${personWorkSentence}`,
    inputSchema: {
      output_id: idInput("The id of the output."),
      tracks: z.array(wireTrack).describe("All tracks, back to front."),
      remove_person_work: removePersonWorkInput,
    },
    run: ({ input: { output_id, tracks, remove_person_work } }) => {
      const snapshot = context.store.read();
      const { framesPerSecond } = snapshot.project;
      const kept = withKeptTransitions({
        before: snapshot.timelines.find(
          (timeline) => timeline.outputId === output_id,
        ),
        tracks: tracks.map((track) => trackOf({ track, framesPerSecond })),
        givenClipIds: transitionClipIdsOf(tracks),
      });
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setTimeline",
            timeline: { outputId: output_id, tracks: kept.tracks },
          },
        ],
        line: `Timeline of "${output_id}" set with ${String(tracks.length)} tracks.${keptLine(kept.keptCount)}`,
        data: { kept_transitions: kept.keptCount },
        keepPersonWork: remove_person_work !== true,
      });
    },
  });
}

function registerRemoveClip(context: HarnessContext): void {
  context.tools.add({
    name: "remove_clip",
    description: `Remove one clip from a timeline. undo brings it back. ${personWorkSentence}`,
    inputSchema: {
      output_id: idInput("The id of the output."),
      clip_id: idInput("The id of the clip from get_timeline."),
      remove_person_work: removePersonWorkInput,
    },
    annotations: { destructiveHint: true },
    run: ({ input: { output_id, clip_id, remove_person_work } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "removeClip", outputId: output_id, clipId: clip_id }],
        line: `Clip "${clip_id}" removed.`,
        keepPersonWork: remove_person_work !== true,
      }),
  });
}

function registerCopyTimeline(context: HarnessContext): void {
  context.tools.add({
    name: "copy_timeline",
    description: `Replace the timeline of one output with a copy of another. Use it to make a tall or square version of a finished wide timeline, then change it. The copy keeps the track ids and the clip ids of the source, so a clip id names the same clip in both outputs. To show another scene in one output, call update_clip with the output_id of that output, the clip_id, and scene_id. Kit scenes adapt their layout to each size. A clip of the target with the same id keeps its transition when the source clip has none. The result gives kept_transitions. ${personWorkSentence}`,
    inputSchema: {
      from_output_id: idInput("The output to copy from."),
      to_output_id: idInput("The output whose timeline is replaced."),
      remove_person_work: removePersonWorkInput,
    },
    run: ({ input: { from_output_id, to_output_id, remove_person_work } }) => {
      const { timelines } = context.store.read();
      const timelineOf = (outputId: string) =>
        timelines.find((timeline) => timeline.outputId === outputId);
      const kept = withKeptTransitions({
        before: timelineOf(to_output_id),
        tracks: timelineOf(from_output_id)?.tracks ?? [],
        givenClipIds: new Set(),
      });
      const keepEdits: Edit[] =
        kept.keptCount === 0
          ? []
          : [
              {
                kind: "setTimeline",
                timeline: { outputId: to_output_id, tracks: kept.tracks },
              },
            ];
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "copyTimeline",
            fromOutputId: from_output_id,
            toOutputId: to_output_id,
          },
          ...keepEdits,
        ],
        line: `Timeline of "${from_output_id}" copied to "${to_output_id}".${keptLine(kept.keptCount)}`,
        data: { kept_transitions: kept.keptCount },
        keepPersonWork: remove_person_work !== true,
      });
    },
  });
}

export function registerTimelineTools(context: HarnessContext): void {
  registerSetTimeline(context);
  registerClipTools(context);
  registerRemoveClip(context);
  registerCopyTimeline(context);
}
