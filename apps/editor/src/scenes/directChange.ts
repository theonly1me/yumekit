import type { EngineClient } from "../engine/engineClient.js";
import { callInOrder } from "../scenePanel/sceneCalls.js";

export type ChangeOutcome =
  | {
      kind: "done";
      data: Record<string, unknown>;
      voiceMayNotMatch: boolean;
    }
  | { kind: "failed"; message: string };

const plainFailures: Record<string, string> = {
  "clip-not-found": "This scene is no longer in the video.",
  "clip-not-on-scenes-row": "This scene is no longer in the row of scenes.",
  "output-not-found": "This shape of the video is no longer in the project.",
  "track-not-found": "This sound is no longer in the video.",
  "invalid-duration": "A scene must be at least one second long.",
  "index-out-of-range": "The scene cannot move further in this direction.",
  "not-found": "This platform is not in the project now.",
  "id-in-use":
    "Another shape of this project has the same name and another size. Ask your agent to remove that shape first.",
};

export async function changeProject(options: {
  client: EngineClient;
  name: string;
  input: object;
}): Promise<ChangeOutcome> {
  const outcome = await callInOrder(options);
  if (outcome.kind === "done") {
    return {
      kind: "done",
      data: outcome.result.data,
      voiceMayNotMatch: outcome.result.data["voice_may_not_match"] === true,
    };
  }
  const plain =
    outcome.failureKind === undefined
      ? undefined
      : plainFailures[outcome.failureKind];
  return {
    kind: "failed",
    message: plain ?? `The change did not apply. ${outcome.message}`,
  };
}
