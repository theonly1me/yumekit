import { randomUUID } from "node:crypto";
import type { Timeline, Track } from "@yumekit/project";
import { z } from "zod";
import { durationInput, frameInput, idInput } from "../inputs.js";

const clipIdInput = idInput(
  "The id of the clip, unique in the timeline. Optional: a random id is made when it is missing.",
).optional();

export const wireSceneClip = z.strictObject({
  id: clipIdInput,
  scene_id: idInput("The scene that the clip shows."),
  start_frame: frameInput("The frame of the output where the clip starts."),
  duration_frames: durationInput("The length of the clip."),
  scene_start_frame: frameInput(
    "The frame of the scene that the clip shows first. Default 0. Use it to cut the start of a scene.",
  ).optional(),
});

export const wireAudioClip = z.strictObject({
  id: clipIdInput,
  asset_id: idInput("The audio asset that the clip plays."),
  start_frame: frameInput("The frame of the output where the sound starts."),
  duration_frames: durationInput(
    "The length of the clip. It must not read past the end of the asset.",
  ),
  asset_start_frame: frameInput(
    "The frame of the asset that plays first. Default 0.",
  ).optional(),
  gain_decibels: z
    .number()
    .optional()
    .describe(
      "Volume change in decibels. Default 0. Use -12 for music under a voice.",
    ),
});

export const wireTrack = z.discriminatedUnion("kind", [
  z.strictObject({
    id: idInput("The id of the track."),
    kind: z.literal("scene"),
    clips: z
      .array(wireSceneClip)
      .describe("Scene clips. They must not overlap."),
  }),
  z.strictObject({
    id: idInput("The id of the track."),
    kind: z.literal("audio"),
    clips: z
      .array(wireAudioClip)
      .describe("Audio clips. They must not overlap."),
  }),
]);

export type WireSceneClip = z.infer<typeof wireSceneClip>;
export type WireAudioClip = z.infer<typeof wireAudioClip>;
export type WireTrack = z.infer<typeof wireTrack>;

export function sceneClipOf(clip: WireSceneClip) {
  return {
    id: clip.id ?? randomUUID(),
    sceneId: clip.scene_id,
    startFrame: clip.start_frame,
    durationFrames: clip.duration_frames,
    sceneStartFrame: clip.scene_start_frame ?? 0,
  };
}

export function audioClipOf(clip: WireAudioClip) {
  return {
    id: clip.id ?? randomUUID(),
    assetId: clip.asset_id,
    startFrame: clip.start_frame,
    durationFrames: clip.duration_frames,
    assetStartFrame: clip.asset_start_frame ?? 0,
    gainDecibels: clip.gain_decibels ?? 0,
  };
}

export function trackOf(track: WireTrack): Track {
  return track.kind === "scene"
    ? { id: track.id, kind: "scene", clips: track.clips.map(sceneClipOf) }
    : { id: track.id, kind: "audio", clips: track.clips.map(audioClipOf) };
}

export function lengthFramesOf(timeline: Timeline): number {
  return Math.max(
    0,
    ...timeline.tracks.flatMap((track) =>
      track.clips.map((clip) => clip.startFrame + clip.durationFrames),
    ),
  );
}

function wireTrackOf(track: Track) {
  return track.kind === "scene"
    ? {
        id: track.id,
        kind: track.kind,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          scene_id: clip.sceneId,
          start_frame: clip.startFrame,
          duration_frames: clip.durationFrames,
          scene_start_frame: clip.sceneStartFrame,
        })),
      }
    : {
        id: track.id,
        kind: track.kind,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          asset_id: clip.assetId,
          start_frame: clip.startFrame,
          duration_frames: clip.durationFrames,
          asset_start_frame: clip.assetStartFrame,
          gain_decibels: clip.gainDecibels,
        })),
      };
}

export function wireTimelineOf(timeline: Timeline) {
  return {
    output_id: timeline.outputId,
    length_frames: lengthFramesOf(timeline),
    tracks: timeline.tracks.map(wireTrackOf),
  };
}
