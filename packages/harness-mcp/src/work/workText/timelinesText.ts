import type {
  ProjectSnapshot,
  Project,
  SceneTransition,
  Track,
} from "@yumekit/project";
import { beatOf } from "../../tempo/beatFacts.js";
import { lengthFramesOf } from "../../timeline/wireTimeline.js";

function spanText(options: {
  project: Project;
  startFrame: number;
  durationFrames: number;
}): string {
  const { project, startFrame, durationFrames } = options;
  const endFrame = startFrame + durationFrames;
  const frames = `frames ${String(startFrame)} to ${String(endFrame)}`;
  const startBeat = beatOf({ project, frame: startFrame });
  const endBeat = beatOf({ project, frame: endFrame });
  return startBeat === undefined || endBeat === undefined
    ? frames
    : `beats ${String(startBeat)} to ${String(endBeat)} (${frames})`;
}

function transitionText(transition: SceneTransition | undefined): string {
  return transition === undefined
    ? ""
    : `, ${transition.kind} in ${String(transition.durationFrames)} frames`;
}

function trackLines(options: { track: Track; project: Project }): string[] {
  const { track, project } = options;
  const off = track.off === true ? ", off" : "";
  const header = `Track ${track.id} (${track.kind}${off}):`;
  if (track.kind === "scene") {
    return [
      header,
      ...track.clips.map(
        (clip) =>
          `- ${clip.id}: scene ${clip.sceneId}, ${spanText({ project, ...clip })}${clip.sceneStartFrame === 0 ? "" : `, from scene frame ${String(clip.sceneStartFrame)}`}${transitionText(clip.transition)}${clip.madeBy === "person" ? ", placed by the person" : ""}`,
      ),
    ];
  }
  return [
    header,
    ...track.clips.map(
      (clip) =>
        `- ${clip.id}: asset ${clip.assetId}, ${spanText({ project, ...clip })}, ${String(clip.gainDecibels)} dB${clip.madeBy === "person" ? ", placed by the person" : ""}`,
    ),
  ];
}

export function timelinesText(snapshot: ProjectSnapshot): string {
  const { project } = snapshot;
  return [
    "## Timelines",
    ...project.outputs.flatMap((output) => {
      const timeline = snapshot.timelines.find(
        (candidate) => candidate.outputId === output.id,
      ) ?? { outputId: output.id, tracks: [] };
      const length = lengthFramesOf(timeline);
      const platforms = (output.platforms ?? []).join(", ");
      return [
        `### Output ${output.id}: ${String(output.widthPixels)} by ${String(output.heightPixels)}${platforms === "" ? "" : ` for ${platforms}`}, ${spanText({ project, startFrame: 0, durationFrames: length })}`,
        ...(timeline.tracks.length === 0
          ? ["No tracks yet."]
          : timeline.tracks.flatMap((track) => trackLines({ track, project }))),
      ];
    }),
  ].join("\n");
}
