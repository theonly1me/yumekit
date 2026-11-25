import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import { withCast } from "../cast/castRequest.js";
import type { HarnessContext } from "../context.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { withStory } from "../storyPlan/shotRequest.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";
import { promptSentOf } from "./promptParts.js";
import { strongReasonOf } from "./strongReason.js";
import { withStrongModel } from "./strongModel.js";
import { videoInputOf } from "./videoChoices.js";

export interface PreparedCall {
  request: GenerateAssetInput;
  sentInput: JsonObject;
  prompt: string | undefined;
  strongNote: string | undefined;
}

export async function prepareCall(options: {
  context: HarnessContext;
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): Promise<Outcome<PreparedCall, HarnessFailure>> {
  const { context, snapshot } = options;
  const storied = withStory({ snapshot, request: options.request });
  if (!storied.ok) return storied;
  const written = storied.value.input["prompt"];
  const why = strongReasonOf({ snapshot, request: storied.value });
  const strong =
    why === undefined
      ? { request: storied.value, note: undefined }
      : await withStrongModel({
          request: storied.value,
          mediaTools: context.mediaTools,
          why,
        });
  const castApplied = await withCast({
    snapshot,
    request: strong.request,
    mediaTools: context.mediaTools,
  });
  if (!castApplied.ok) return castApplied;
  const request = castApplied.value;
  const sentInput = await videoInputOf({
    request,
    mediaTools: context.mediaTools,
  });
  if (!sentInput.ok) return sentInput;
  return {
    ok: true,
    value: {
      request,
      sentInput: sentInput.value,
      prompt: promptSentOf({ written, sent: sentInput.value["prompt"] }),
      strongNote: strong.note,
    },
  };
}
