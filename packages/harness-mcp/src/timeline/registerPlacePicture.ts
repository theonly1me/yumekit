import {
  assetLabelOf,
  type Edit,
  type ProjectSnapshot,
} from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findAsset, findOutput } from "../lookups.js";
import { failureResult } from "../results.js";
import { uniqueId } from "./narrationPlan.js";
import { removePersonWorkInput } from "./personWorkInput.js";
import { pictureGateFailureOf } from "./pictureGate.js";
import { placementFramesOf } from "./videoPlacementFrames.js";
import { replacedClipOf, videoTitleOf } from "./videoPlan.js";

const pictureComponent = "image-pan";
const idLengthLimit = 64;

function sceneEditsOf(options: {
  snapshot: ProjectSnapshot;
  sceneId: string;
  assetId: string;
  title: string;
}): Edit[] {
  if (options.snapshot.scenes.some((scene) => scene.id === options.sceneId)) {
    return [];
  }
  return [
    {
      kind: "putScene",
      scene: {
        id: options.sceneId,
        title: options.title,
        notes: "Made by place_picture.",
        source: {
          kind: "kit",
          component: pictureComponent,
          props: { assetId: options.assetId },
        },
      },
    },
  ];
}

export function registerPlacePicture(context: HarnessContext): void {
  context.tools.add({
    name: "place_picture",
    description:
      'Show a picture in the place of one scene clip, as an image-pan scene "picture-<asset_id>" with a slow move over the picture (or that scene when it exists, with no change to its props). The new clip keeps the start, the length, and the transition of the replaced clip, and the tool removes the replaced clip and the sound of its video. The result gives scene_id and scene_clip_id. A picture that the person dropped or asked to change in a take fails with picture-not-approved. A picture of a shot whose people have a look needs a design check first (design-not-checked), and a picture whose design breaks fails with design-break-in-range. A clip that the person made fails with would-remove-the-work-of-the-person, unless remove_person_work is true. One undo brings the replaced clip back.',
    inputSchema: {
      output_id: idInput("The id of the output."),
      asset_id: idInput("The id of an image asset."),
      replace_clip_id: idInput(
        "The scene clip whose place the picture takes, from get_timeline.",
      ),
      remove_person_work: removePersonWorkInput,
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const output = findOutput({ snapshot, outputId: input.output_id });
      if (!output.ok) return failureResult(output.failure);
      const asset = findAsset({ snapshot, assetId: input.asset_id });
      if (!asset.ok) return failureResult(asset.failure);
      if (asset.value.kind !== "image") {
        return failureResult({
          kind: "asset-not-image",
          message: `The asset "${input.asset_id}" is of kind ${asset.value.kind}. place_picture needs a picture.`,
          hint: "For a video asset, call place_video with replace_clip_id.",
        });
      }
      const refused = pictureGateFailureOf({ snapshot, asset: asset.value });
      if (refused !== undefined) return failureResult(refused);
      const { timeline } = output.value;
      const frames = placementFramesOf({
        snapshot,
        timeline,
        assetLength: 1,
        startFrame: undefined,
        durationFrames: undefined,
        replaceClipId: input.replace_clip_id,
      });
      if (!frames.ok) return failureResult(frames.failure);
      const replaced = replacedClipOf({
        timeline,
        replaceClipId: input.replace_clip_id,
      });
      const track = timeline.tracks.find((candidate) =>
        candidate.clips.some((clip) => clip.id === input.replace_clip_id),
      );
      if (replaced === undefined || track === undefined) {
        return failureResult({
          kind: "clip-not-found",
          message: `The output "${input.output_id}" has no scene clip "${input.replace_clip_id}".`,
          hint: "Call get_timeline and give the id of a scene clip.",
        });
      }
      const sceneId = `picture-${asset.value.id}`.slice(0, idLengthLimit);
      const sceneClipId = uniqueId({
        base: `picture-${asset.value.id}`,
        taken: frames.value.remainingTimeline.tracks.flatMap((each) =>
          each.clips.map((clip) => clip.id),
        ),
      });
      const { startFrame, durationFrames } = frames.value;
      return applyEditsResult({
        store: context.store,
        edits: [
          ...sceneEditsOf({
            snapshot,
            sceneId,
            assetId: asset.value.id,
            title: videoTitleOf({
              snapshot,
              timeline,
              asset: asset.value,
              replaceClipId: input.replace_clip_id,
            }),
          }),
          ...frames.value.removeEdits,
          {
            kind: "addClip",
            outputId: input.output_id,
            trackId: track.id,
            clip: {
              id: sceneClipId,
              sceneId,
              startFrame,
              durationFrames,
              sceneStartFrame: 0,
              ...(replaced.transition === undefined
                ? {}
                : { transition: replaced.transition }),
            },
          },
        ],
        keepPersonWork: input.remove_person_work !== true,
        line: `Picture "${assetLabelOf(asset.value)}" shows on "${input.output_id}" from frame ${String(startFrame)} to ${String(startFrame + durationFrames)}, in the place of "${input.replace_clip_id}".`,
        data: {
          scene_id: sceneId,
          scene_clip_id: sceneClipId,
          start_frame: startFrame,
          duration_frames: durationFrames,
        },
      });
    },
  });
}
