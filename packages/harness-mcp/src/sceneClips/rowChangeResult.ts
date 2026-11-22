import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  Edit,
  ProjectSnapshot,
  SceneClip,
  Timeline,
} from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import type { StructuredData } from "../results.js";
import type { RowTarget } from "./rowTargets.js";

export interface RowChange {
  target: RowTarget;
  clips: SceneClip[];
}

function timelineEditOf(change: RowChange): Edit {
  const { timeline, trackId } = change.target;
  return {
    kind: "setTimeline",
    timeline: {
      ...timeline,
      tracks: timeline.tracks.map((track) =>
        track.id === trackId && track.kind === "scene"
          ? { ...track, clips: change.clips }
          : track,
      ),
    },
  };
}

export function hasVoiceClip(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
}): boolean {
  const voiceAssetIds = new Set(
    options.snapshot.assets
      .filter((asset) => asset.hasWords)
      .map((asset) => asset.id),
  );
  return options.timeline.tracks.some(
    (track) =>
      track.kind === "audio" &&
      track.clips.some((clip) => voiceAssetIds.has(clip.assetId)),
  );
}

function wireRowOf(change: RowChange) {
  return {
    output_id: change.target.timeline.outputId,
    track_id: change.target.trackId,
    clips: change.clips.map((clip) => ({
      clip_id: clip.id,
      scene_id: clip.sceneId,
      start_frame: clip.startFrame,
      duration_frames: clip.durationFrames,
    })),
  };
}

export function rowChangeResult(options: {
  context: HarnessContext;
  changes: RowChange[];
  sceneEdits?: Edit[];
  line: string;
  data?: StructuredData;
}): Promise<CallToolResult> {
  const { context, changes } = options;
  const snapshot = context.store.read();
  const voiceMayNotMatch = changes.some((change) =>
    hasVoiceClip({ snapshot, timeline: change.target.timeline }),
  );
  return applyEditsResult({
    store: context.store,
    edits: [...(options.sceneEdits ?? []), ...changes.map(timelineEditOf)],
    line: `${options.line}${voiceMayNotMatch ? " The voice may not match the scenes now." : ""}`,
    data: {
      ...options.data,
      output_ids: changes.map((change) => change.target.timeline.outputId),
      scenes_rows: changes.map(wireRowOf),
      voice_may_not_match: voiceMayNotMatch,
    },
  });
}
