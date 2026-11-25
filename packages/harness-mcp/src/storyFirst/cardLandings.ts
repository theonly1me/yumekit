import {
  beatOfFrame,
  framesPerBeatOf,
  frameOfBeat,
  tempoGridOf,
  type ProjectSnapshot,
  type TempoGrid,
  type Timeline,
} from "@yumekit/project";
import { cardScenesOf, type CardScene } from "./trailerCards.js";

export const hitToleranceFrames = 2;

const secondsOfBeatWithNoTempo = 0.5;

export type LandsOn = "hit" | "beat" | "off";

export interface CardLanding {
  sceneId: string;
  clipId: string;
  outputId: string;
  landsAtSeconds: number;
  landsOn: LandsOn;
  line: string;
}

interface FilmHit {
  frame: number;
  assetId: string;
}

function hitsOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
}): FilmHit[] {
  const checks = options.snapshot.bible.storyPlan?.musicChecks ?? [];
  const fps = options.snapshot.project.framesPerSecond;
  return options.timeline.tracks.flatMap((track) => {
    if (track.kind !== "audio" || track.off === true) return [];
    return track.clips.flatMap((clip) => {
      const check = checks.find((entry) => entry.assetId === clip.assetId);
      return (check?.hits ?? []).flatMap((hitSeconds) => {
        const assetFrame = Math.round(hitSeconds * fps);
        const inside =
          assetFrame >= clip.assetStartFrame &&
          assetFrame < clip.assetStartFrame + clip.durationFrames;
        return inside
          ? [
              {
                frame: clip.startFrame + assetFrame - clip.assetStartFrame,
                assetId: clip.assetId,
              },
            ]
          : [];
      });
    });
  });
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function nearestBeat(options: { grid: TempoGrid; frame: number }) {
  const beat = Math.round(beatOfFrame(options) * 2) / 2;
  const frame = frameOfBeat({ grid: options.grid, beat });
  return { beat, frame, isOn: Math.abs(frame - options.frame) <= 1 };
}

function landingOf(options: {
  card: CardScene;
  clip: { id: string; startFrame: number; sceneStartFrame: number };
  outputId: string;
  hits: FilmHit[];
  grid: TempoGrid | undefined;
  fps: number;
}): CardLanding {
  const { card, clip, hits, grid, fps } = options;
  const beatFrames =
    grid === undefined ? secondsOfBeatWithNoTempo * fps : framesPerBeatOf(grid);
  const frame =
    clip.startFrame +
    Math.max(
      0,
      Math.round(card.landsOnBeat * beatFrames) - clip.sceneStartFrame,
    );
  const seconds = (value: number) => `${String(rounded(value / fps))}s`;
  const start = `Card "${card.sceneId}" (clip "${clip.id}" of "${options.outputId}") lands at ${seconds(frame)}`;
  const byDistance = hits.toSorted(
    (...[first, second]) =>
      Math.abs(first.frame - frame) - Math.abs(second.frame - frame),
  );
  const [nearest] = byDistance;
  const base = {
    sceneId: card.sceneId,
    clipId: clip.id,
    outputId: options.outputId,
    landsAtSeconds: rounded(frame / fps),
  };
  if (
    nearest !== undefined &&
    Math.abs(nearest.frame - frame) <= hitToleranceFrames
  ) {
    return {
      ...base,
      landsOn: "hit",
      line: `${start}, on the measured hit at ${seconds(nearest.frame)} of the music "${nearest.assetId}".`,
    };
  }
  const hitText =
    nearest === undefined
      ? " The music in the video has no measured hits: check_music measures them."
      : ` The nearest measured hits of the music are at ${byDistance
          .slice(0, 2)
          .map((hit) => seconds(hit.frame))
          .join(" and ")}: move the clip so the words land on one.`;
  if (grid === undefined) {
    return {
      ...base,
      landsOn: "off",
      line: `${start}. The project has no tempo, so it has no beat grid (set_tempo).${hitText}`,
    };
  }
  const beat = nearestBeat({ grid, frame });
  return beat.isOn
    ? {
        ...base,
        landsOn: "beat",
        line: `${start}, on beat ${String(beat.beat)} of the grid.${hitText}`,
      }
    : {
        ...base,
        landsOn: "off",
        line: `${start}, between beats: the nearest beat is ${String(beat.beat)} at ${seconds(beat.frame)}.${hitText}`,
      };
}

export function cardLandingsOf(options: {
  snapshot: ProjectSnapshot;
  outputId?: string;
}): CardLanding[] {
  const { snapshot } = options;
  const cards = cardScenesOf(snapshot.scenes);
  const grid = tempoGridOf(snapshot.project);
  const fps = snapshot.project.framesPerSecond;
  return snapshot.timelines
    .filter(
      (timeline) =>
        options.outputId === undefined ||
        timeline.outputId === options.outputId,
    )
    .flatMap((timeline) => {
      const hits = hitsOf({ snapshot, timeline });
      return timeline.tracks.flatMap((track) =>
        track.kind !== "scene"
          ? []
          : track.clips.flatMap((clip) => {
              const card = cards.find(
                (entry) => entry.sceneId === clip.sceneId,
              );
              return card === undefined
                ? []
                : [
                    landingOf({
                      card,
                      clip,
                      outputId: timeline.outputId,
                      hits,
                      grid,
                      fps,
                    }),
                  ];
            }),
      );
    });
}
