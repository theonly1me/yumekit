import {
  approvePicturesFirstOf,
  isCalm,
  lookOf,
  videoStyleOf,
  voiceMatchesScript,
} from "@yumekit/project";
import { wireCastMemberOf } from "../cast/castMembers.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findOutput, findScene } from "../lookups.js";
import { failureResult, successResult } from "../results.js";
import { videoStyleMeanings } from "../story/videoStyleMeanings.js";
import { lengthFramesOf, wireTimelineOf } from "../timeline/wireTimeline.js";
import { wireSceneOf } from "../wireRecords.js";
import { tempoFactsOf, timelineWithBeats } from "../tempo/beatFacts.js";
import { voiceTextsOf } from "./voiceTexts.js";

const readOnly = { readOnlyHint: true } as const;

function registerGetProject(context: HarnessContext): void {
  context.tools.add({
    name: "get_project",
    description: `Read the project: name, frame rate, the look and calm, outputs with the platforms of each output and the length of each timeline in frames, script, voice_matches_script (false when a placed voice says words that the script no longer has, so record the voice again), bible with the cast, a list of scenes, the video style, and the revision. Call it first. All time in this harness is in whole frames at frames_per_second. With a tempo (set_tempo), tempo and frames_per_beat are set, and each time input also takes beats. fonts lists the font families of set_fonts, and shared_code the modules of put_shared_code. video_style is the choice of the person for how the video is made: ${videoStyleMeanings}`,
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
          approve_pictures_first: approvePicturesFirstOf(project),
          look: lookOf(project),
          calm: isCalm(project),
          look_colors: project.lookColors ?? null,
          look_font: project.lookFont ?? null,
          ...tempoFactsOf(project),
          fonts: (project.fonts ?? []).map((font) => ({
            asset_id: font.assetId,
            family: font.family,
            ...(font.weight === undefined ? {} : { weight: font.weight }),
            ...(font.style === undefined ? {} : { style: font.style }),
          })),
          shared_code: Object.keys(snapshot.sharedCode),
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
          voice_matches_script: voiceMatchesScript({
            script: snapshot.script,
            voiceTexts: voiceTextsOf(snapshot),
          }),
          bible: {
            style: snapshot.bible.style,
            palette: snapshot.bible.palette,
            cast: snapshot.bible.cast.map(wireCastMemberOf),
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
      "Read all tracks and clips of one output, and its length in frames. With a tempo (set_tempo), each clip also has start_beat and duration_beats, and the timeline has length_beats. Scene tracks draw in list order: the first track is at the back. The result has the same track fields as the input of set_timeline.",
    inputSchema: { output_id: idInput("The id of the output.") },
    annotations: readOnly,
    run: ({ input: { output_id } }) => {
      const snapshot = context.store.read();
      const found = findOutput({ snapshot, outputId: output_id });
      if (!found.ok) return failureResult(found.failure);
      const data = timelineWithBeats({
        timeline: wireTimelineOf(found.value.timeline),
        project: snapshot.project,
      });
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
