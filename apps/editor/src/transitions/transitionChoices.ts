import type { SceneClip } from "../engine/snapshot.js";

export type TransitionChoice =
  "cut" | NonNullable<SceneClip["transition"]>["kind"];

export const transitionChoices: {
  kind: TransitionChoice;
  name: string;
  line: string;
}[] = [
  { kind: "cut", name: "Cut", line: "The next scene starts at once" },
  { kind: "fade", name: "Fade", line: "The next scene fades in" },
  { kind: "slide", name: "Slide", line: "The next scene pushes this one out" },
  {
    kind: "wipe",
    name: "Wipe",
    line: "An edge moves across to show the next scene",
  },
  {
    kind: "zoom",
    name: "Zoom",
    line: "This scene grows as the next one comes in",
  },
];

export function choiceOf(clip: SceneClip): TransitionChoice {
  return clip.transition?.kind ?? "cut";
}

export function nameOf(kind: TransitionChoice): string {
  return (
    transitionChoices.find((choice) => choice.kind === kind)?.name ?? "Cut"
  );
}

export function sharedChoiceOf(
  clips: SceneClip[],
): TransitionChoice | "mixed" | "none" {
  const choices = new Set(
    clips
      .filter((clip) =>
        clips.some(
          (other) =>
            other.startFrame + other.durationFrames === clip.startFrame,
        ),
      )
      .map(choiceOf),
  );
  const [only] = choices;
  return only === undefined ? "none" : choices.size === 1 ? only : "mixed";
}
