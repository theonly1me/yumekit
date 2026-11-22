import type { SceneTransition } from "@yumekit/project";
import { z } from "zod";
import { durationInput } from "../inputs.js";

export const transitionKindInput = z
  .enum(["cut", "fade", "slide", "wipe", "zoom"])
  .describe(
    "How the clip comes in over the clip before it on the same track. cut: no transition. fade: the new scene fades in over the old one. slide: the new scene pushes the old one out to the left. wipe: a straight edge moves across and shows the new scene. zoom: the old scene grows while the new one grows from small and fades in.",
  );

export const transitionFramesInput = durationInput(
  "The length of the transition. Default: the frames of 0.4 seconds. The preview and the render use at most half of the shorter of the two clips. The old clip holds its last picture, and the new clip runs from its first frame, so no clip changes its length and no sound moves.",
).optional();

export const wireTransition = z
  .strictObject({
    kind: transitionKindInput,
    duration_frames: transitionFramesInput,
  })
  .describe(
    "Optional. The transition from the clip before this one on the same track. A transition on the first clip of a track, or after a gap, does nothing.",
  );

export type WireTransition = z.infer<typeof wireTransition>;

export function defaultTransitionFrames(framesPerSecond: number): number {
  return Math.max(1, Math.round(0.4 * framesPerSecond));
}

export function transitionOf(options: {
  wire: WireTransition;
  framesPerSecond: number;
}): SceneTransition | { kind: "cut" } {
  const { wire } = options;
  return wire.kind === "cut"
    ? { kind: "cut" }
    : {
        kind: wire.kind,
        durationFrames:
          wire.duration_frames ??
          defaultTransitionFrames(options.framesPerSecond),
      };
}

export function storedTransitionOf(options: {
  wire: WireTransition | undefined;
  framesPerSecond: number;
}): { transition?: SceneTransition } {
  if (options.wire === undefined) return {};
  const transition = transitionOf({
    wire: options.wire,
    framesPerSecond: options.framesPerSecond,
  });
  return transition.kind === "cut" ? {} : { transition };
}

export function wireTransitionOf(transition: SceneTransition | undefined): {
  transition?: { kind: string; duration_frames: number };
} {
  return transition === undefined
    ? {}
    : {
        transition: {
          kind: transition.kind,
          duration_frames: transition.durationFrames,
        },
      };
}
