import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Edit, EditFailure, ProjectStore } from "@yumekit/project";
import {
  failureResult,
  successResult,
  type StructuredData,
} from "./results.js";

type EditFailureKind = EditFailure["kind"];

export type EditHints = Partial<Record<EditFailureKind, string>>;

const defaultEditHints: Record<EditFailureKind, string> = {
  "id-in-use":
    "Choose another id, or call get_project, get_timeline, or list_assets to see the ids in use.",
  "not-found":
    "Call get_project for output and scene ids, get_timeline for track and clip ids, or list_assets for asset ids. Then call this tool again with an id that exists.",
  "still-referenced":
    "Remove each clip that the message names with remove_clip, or replace the timeline with set_timeline. Then call this tool again.",
  "clips-overlap":
    "Call get_timeline. A clip covers the frames from start_frame to start_frame + duration_frames - 1. Move or shorten a clip with update_clip, or put it on another track.",
  "invalid-value":
    "Correct the value that the message names. Time is in whole frames. Output sizes are even numbers from 16 to 7680. Ids match ^[a-z0-9][a-z0-9-]{0,63}$.",
  "chapter-misses-shot":
    "Give chapters to set_story_plan with each shot of the plan in exactly one chapter, in the order of the shots.",
  "shot-in-two-chapters":
    "Give chapters to set_story_plan with each shot of the plan in exactly one chapter, in the order of the shots.",
  "chapters-break-order":
    "Give chapters to set_story_plan in the order of the shots: each chapter takes the next shots of the plan.",
  "would-remove-the-work-of-the-person":
    "Call get_timeline and keep each thing that the message names, with its id, in the call. To change only the voice or the music, call replace_narration or replace_music. Give remove_person_work true only when the person asked for that removal in this request.",
};

export async function applyEditsResult(options: {
  store: ProjectStore;
  edits: Edit[];
  line: string;
  data?: StructuredData;
  hints?: EditHints;
  keepPersonWork?: boolean;
}): Promise<CallToolResult> {
  const applied = await options.store.applyChange({
    edits: options.edits,
    keepPersonWork: options.keepPersonWork ?? false,
  });
  if (!applied.ok) {
    const { kind, message, removed } = applied.failure;
    return failureResult({
      kind,
      message,
      hint: options.hints?.[kind] ?? defaultEditHints[kind],
      ...(removed === undefined ? {} : { removed }),
    });
  }
  return successResult({
    line: options.line,
    data: { ...options.data, revision: applied.value.revision },
  });
}
