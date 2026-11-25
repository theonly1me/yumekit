import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Edit, ProjectSnapshot, Scene } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { withCardLines } from "../storyFirst/withCardLines.js";
import { personWorkSentence } from "../timeline/personWorkInput.js";
import { shownClipsFailureOf } from "../timeline/shownClips.js";
import { timelineEditOf } from "../timeline/timelineEdit.js";
import { checkWork, workFailureOf } from "./checkWork.js";
import { removalEditsOf, removedAssetInUse } from "./workRemovals.js";
import {
  putWorkInput,
  type PutWorkInput,
  type WorkScene,
} from "./putWorkInput.js";

function sceneEditOf(scene: WorkScene): Edit {
  const common = {
    id: scene.scene_id,
    title: scene.title,
    notes: scene.notes ?? "",
  };
  const props = scene.props ?? {};
  if (scene.kit_component !== undefined) {
    const kitScene: Scene = {
      ...common,
      source: { kind: "kit", component: scene.kit_component, props },
    };
    return { kind: "putScene", scene: kitScene };
  }
  const moduleScene: Scene = { ...common, source: { kind: "module", props } };
  return { kind: "putScene", scene: moduleScene, code: scene.code ?? "" };
}

function frameEditsOf(frame: PutWorkInput["frame"]): Edit[] {
  if (frame === undefined) return [];
  return [
    frame === null ? { kind: "setFrame" } : { kind: "setFrame", name: frame },
  ];
}

function countLine(options: { count: number; one: string; many: string }) {
  return `${String(options.count)} ${options.count === 1 ? options.one : options.many}`;
}

function editsOf(options: { input: PutWorkInput; snapshot: ProjectSnapshot }) {
  const { input, snapshot } = options;
  const timelines = (input.timelines ?? []).map((timeline) => ({
    outputId: timeline.output_id,
    ...timelineEditOf({
      snapshot,
      outputId: timeline.output_id,
      tracks: timeline.tracks,
    }),
  }));
  const edits: Edit[] = [
    ...(input.shared_code ?? []).map((module): Edit => ({
      kind: "putSharedCode",
      ...module,
    })),
    ...(input.scenes ?? []).map(sceneEditOf),
    ...frameEditsOf(input.frame),
    ...timelines.map((timeline) => timeline.edit),
    ...removalEditsOf(input),
  ];
  return { edits, timelines };
}

async function putWork(options: {
  context: HarnessContext;
  input: PutWorkInput;
}): Promise<CallToolResult> {
  const { context, input } = options;
  const snapshot = context.store.read();
  const checked = await checkWork({ input, snapshot });
  if (checked.failures.length > 0) {
    return failureResult(workFailureOf(checked.failures));
  }
  const assetInUse = removedAssetInUse({ input, snapshot });
  if (assetInUse !== undefined) return failureResult(assetInUse);
  const { edits, timelines } = editsOf({ input, snapshot });
  const shown = shownClipsFailureOf({ snapshot, edits });
  if (shown !== undefined) return failureResult(shown);
  if (edits.length === 0) {
    return failureResult({
      kind: "work-empty",
      message:
        "put_work got no shared code, no scene, no timeline, no frame, and nothing to remove.",
      hint: "Give at least one part. Call get_work to read the work first.",
    });
  }
  const sharedNames = (input.shared_code ?? []).map((module) => module.name);
  const sceneIds = (input.scenes ?? []).map((scene) => scene.scene_id);
  const removedSceneIds = input.remove?.scene_ids ?? [];
  const removedAssetIds = input.remove?.asset_ids ?? [];
  const removedLine =
    removedSceneIds.length + removedAssetIds.length === 0
      ? ""
      : ` Removed ${countLine({ count: removedSceneIds.length, one: "scene", many: "scenes" })} and ${countLine({ count: removedAssetIds.length, one: "asset", many: "assets" })}.`;
  return applyEditsResult({
    store: context.store,
    edits,
    line: `The work is saved as one change: ${countLine({ count: sharedNames.length, one: "shared module", many: "shared modules" })}, ${countLine({ count: sceneIds.length, one: "scene", many: "scenes" })}, ${countLine({ count: timelines.length, one: "timeline", many: "timelines" })}. One undo removes all of it.${removedLine}`,
    data: {
      shared_code: sharedNames,
      scene_ids: sceneIds,
      timelines: timelines.map((timeline) => ({
        output_id: timeline.outputId,
        kept_transitions: timeline.keptCount,
      })),
      frame:
        input.frame === undefined
          ? (snapshot.project.frame ?? null)
          : input.frame,
      removed_scene_ids: removedSceneIds,
      removed_asset_ids: removedAssetIds,
    },
    keepPersonWork: input.remove_person_work !== true,
  });
}

export function registerPutWork(context: HarnessContext): void {
  context.tools.add({
    name: "put_work",
    description: `Write the video as one piece in one call: shared code, scenes, the frame, and the timelines. The harness checks every part together, so a scene can import the shared code of the same call. When one part fails its check, nothing changes, and the failure lists each part. When all pass, the whole call is one change, and one undo removes all of it. Use kit scenes where they fit (they draw in the colors of set_look), write shared code only for what custom scenes share, then the timeline. remove takes away scenes and assets in the same change, for example the scenes that you made only to look at a file. A clip of a shot of the story plan needs a design check and shows only its clean part, as in place_video. Read the work with get_work before you change a video that exists. ${personWorkSentence}`,
    inputSchema: putWorkInput,
    run: ({ input }) =>
      withCardLines({
        result: putWork({ context, input }),
        read: () => context.store.read(),
      }),
  });
}
