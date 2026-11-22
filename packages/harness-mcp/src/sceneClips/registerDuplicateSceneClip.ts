import type { Edit, ProjectSnapshot, Scene } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { uniqueId } from "../timeline/narrationPlan.js";
import { rowWithCopy } from "./rowArrangements.js";
import { rowChangeResult } from "./rowChangeResult.js";
import { rowTargetsOf, type RowTarget } from "./rowTargets.js";
import {
  outputIdsInput,
  sceneClipIdInput,
  sceneClipToolNote,
} from "./sceneClipInputs.js";

function sceneCopiesOf(options: {
  snapshot: ProjectSnapshot;
  sceneIds: string[];
}): Map<string, string> {
  const taken = options.snapshot.scenes.map((scene) => scene.id);
  const copies = new Map<string, string>();
  for (const sceneId of new Set(options.sceneIds)) {
    const copyId = uniqueId({ base: `${sceneId}-copy`, taken });
    taken.push(copyId);
    copies.set(sceneId, copyId);
  }
  return copies;
}

function copyEditOf(options: {
  snapshot: ProjectSnapshot;
  scene: Scene;
  copyId: string;
}): Edit {
  const { snapshot, scene, copyId } = options;
  const copy = { ...scene, id: copyId, title: `${scene.title} (copy)` };
  if (scene.source.kind === "kit") return { kind: "putScene", scene: copy };
  const code = snapshot.sceneCode[scene.id];
  if (code === undefined) {
    throw new Error(`The module scene "${scene.id}" has no code`);
  }
  return { kind: "putScene", scene: copy, code };
}

function originalSceneIdOf(target: RowTarget): string {
  const clip = target.clips[target.clipIndex];
  if (clip === undefined) throw new Error("The row target has no clip");
  return clip.sceneId;
}

function copyIdOf(options: {
  copies: Map<string, string>;
  target: RowTarget;
}): string {
  const copyId = options.copies.get(originalSceneIdOf(options.target));
  if (copyId === undefined) throw new Error("The scene has no planned copy");
  return copyId;
}

export function registerDuplicateSceneClip(context: HarnessContext): void {
  context.tools.add({
    name: "duplicate_scene_clip",
    description: `Copy the scene of one scene clip, and put a clip of the copy right after the clip, with the same length. Each later clip of the scenes row moves later by that length. The copy gets the id "<scene_id>-copy" (a suffix such as "-2" keeps it unique) and the title "<title> (copy)". The new clip gets the id "<clip_id>-copy" in each changed output. Use it in place of put_scene and add_clip to repeat a scene, then change the copy with put_scene. ${sceneClipToolNote}`,
    inputSchema: { output_ids: outputIdsInput, clip_id: sceneClipIdInput },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const targets = rowTargetsOf({
        snapshot,
        clipId: input.clip_id,
        outputIds: input.output_ids,
      });
      if (!targets.ok) return failureResult(targets.failure);
      const copies = sceneCopiesOf({
        snapshot,
        sceneIds: targets.value.map(originalSceneIdOf),
      });
      const clipId = uniqueId({
        base: `${input.clip_id}-copy`,
        taken: targets.value.flatMap((target) =>
          target.timeline.tracks.flatMap((track) =>
            track.clips.map((clip) => clip.id),
          ),
        ),
      });
      const sceneEdits = snapshot.scenes.flatMap((scene) => {
        const copyId = copies.get(scene.id);
        return copyId === undefined
          ? []
          : [copyEditOf({ snapshot, scene, copyId })];
      });
      return rowChangeResult({
        context,
        sceneEdits,
        changes: targets.value.map((target) => ({
          target,
          clips: rowWithCopy({
            ...target,
            copy: {
              clipId,
              sceneId: copyIdOf({ copies, target }),
            },
          }),
        })),
        line: `Clip "${input.clip_id}" copied to the new clip "${clipId}".`,
        data: { clip_id: clipId, scene_ids: [...copies.values()] },
      });
    },
  });
}
