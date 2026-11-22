import { lookOf, videoStyleOf } from "@yumekit/project";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findOutput, findScene } from "../lookups.js";
import { failureResult, successResult } from "../results.js";
import { videoStyleMeanings } from "../story/videoStyleMeanings.js";
import { lengthFramesOf, wireTimelineOf } from "../timeline/wireTimeline.js";
import { wireSceneOf } from "../wireRecords.js";

const readOnly = { readOnlyHint: true } as const;

function registerGetProject(context: HarnessContext): void {
  context.tools.add({
    name: "get_project",
    description: `Read the project: name, frame rate, the look, outputs with the platforms of each output and the length of each timeline in frames, script, bible, a list of scenes, the video style, and the revision. Call it first. All time in this harness is in whole frames at frames_per_second. video_style is the choice of the person for how the video is made: ${videoStyleMeanings}`,
    inputSchema: {},
    annotations: readOnly,
    run: () => {
      const snapshot = context.store.read();
      const { project } = snapshot;
      return successResult({
        line: `Project "${project.name}" at ${String(project.framesPerSecond)} frames per second, revision ${String(snapshot.revision)}.`,
        data: {
          name: project.name,
          frames_per_second: project.framesPerSecond,
          video_style: videoStyleOf(project),
          look: lookOf(project),
          outputs: project.outputs.map((output) => {
            const timeline = snapshot.timelines.find(
              (candidate) => candidate.outputId === output.id,
            );
            return {
              id: output.id,
              label: output.label,
              width_pixels: output.widthPixels,
              height_pixels: output.heightPixels,
              platforms: output.platforms ?? [],
              length_frames: timeline ? lengthFramesOf(timeline) : 0,
            };
          }),
          script: snapshot.script,
          bible: {
            style: snapshot.bible.style,
            palette: snapshot.bible.palette,
            cast: snapshot.bible.cast.map((member) => ({
              id: member.id,
              name: member.name,
              description: member.description,
              reference_asset_ids: member.referenceAssetIds,
            })),
            voice: snapshot.bible.voice,
          },
          scenes: snapshot.scenes.map((scene) => ({
            id: scene.id,
            title: scene.title,
            kind: scene.source.kind,
          })),
          revision: snapshot.revision,
        },
      });
    },
  });
}

function registerGetScene(context: HarnessContext): void {
  context.tools.add({
    name: "get_scene",
    description:
      "Read one scene: title, notes, kind, props, the kit component of a kit scene, and the code of a module scene. The result has the same fields as the input of put_scene.",
    inputSchema: { scene_id: idInput("The id of the scene.") },
    annotations: readOnly,
    run: ({ input: { scene_id } }) => {
      const snapshot = context.store.read();
      const found = findScene({ snapshot, sceneId: scene_id });
      if (!found.ok) return failureResult(found.failure);
      return successResult({
        line: `Scene "${scene_id}" (${found.value.source.kind}).`,
        data: wireSceneOf({ scene: found.value, snapshot }),
      });
    },
  });
}

function registerGetTimeline(context: HarnessContext): void {
  context.tools.add({
    name: "get_timeline",
    description:
      "Read all tracks and clips of one output, and its length in frames. Scene tracks draw in list order: the first track is at the back. The result has the same track fields as the input of set_timeline.",
    inputSchema: { output_id: idInput("The id of the output.") },
    annotations: readOnly,
    run: ({ input: { output_id } }) => {
      const found = findOutput({
        snapshot: context.store.read(),
        outputId: output_id,
      });
      if (!found.ok) return failureResult(found.failure);
      const data = wireTimelineOf(found.value.timeline);
      return successResult({
        line: `Timeline of "${output_id}": ${String(data.tracks.length)} tracks, ${String(data.length_frames)} frames.`,
        data,
      });
    },
  });
}

export function registerProjectReadTools(context: HarnessContext): void {
  registerGetProject(context);
  registerGetScene(context);
  registerGetTimeline(context);
}
