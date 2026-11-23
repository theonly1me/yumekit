import {
  cameraMoveIds,
  findCameraMove,
  type JsonObject,
} from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import type { HarnessFailure, Outcome } from "../results.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";

function notForVideo(options: {
  field: string;
  capability: string;
}): Outcome<never, HarnessFailure> {
  return {
    ok: false,
    failure: {
      kind: "invalid-value",
      message: `${options.field} is for a video clip, not for ${options.capability}.`,
      hint: `Leave out ${options.field}, or use the capability video.`,
    },
  };
}

function inputWithCameraMove(
  request: GenerateAssetInput,
): Outcome<JsonObject, HarnessFailure> {
  const { camera_move: cameraMoveId, input } = request;
  if (cameraMoveId === undefined) return { ok: true, value: input };
  const cameraMove = findCameraMove(cameraMoveId);
  if (cameraMove === undefined) {
    return {
      ok: false,
      failure: {
        kind: "camera-move-not-found",
        message: `yumekit has no camera move "${cameraMoveId}".`,
        hint: `Use one of these camera moves: ${cameraMoveIds.join(", ")}. Or leave out camera_move.`,
      },
    };
  }
  const prompt = input["prompt"];
  return {
    ok: true,
    value:
      typeof prompt === "string"
        ? { ...input, prompt: `${prompt}\n\n${cameraMove.sentence}` }
        : input,
  };
}

async function lastFrameFailureOf(options: {
  request: GenerateAssetInput;
  mediaTools: MediaTools;
}): Promise<HarnessFailure | undefined> {
  const { request } = options;
  if (request.last_frame_asset_id === undefined) return undefined;
  const model = await options.mediaTools.chosenModel({
    capability: "video",
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
  });
  if (model?.accepts?.includes("last_frame") === true) return undefined;
  const name =
    model === undefined
      ? `The video model of ${request.server ?? "the default server"}`
      : `The video model ${model.id}`;
  return {
    kind: "invalid-value",
    message: `${name} takes no last picture.`,
    hint: "Leave out last_frame_asset_id, or pick a video model whose accepts in list_media_tools has last_frame.",
  };
}

export async function videoInputOf(options: {
  request: GenerateAssetInput;
  mediaTools: MediaTools;
}): Promise<Outcome<JsonObject, HarnessFailure>> {
  const { request } = options;
  if (request.capability !== "video") {
    if (request.camera_move !== undefined) {
      return notForVideo({
        field: "camera_move",
        capability: request.capability,
      });
    }
    if (request.last_frame_asset_id !== undefined) {
      return notForVideo({
        field: "last_frame_asset_id",
        capability: request.capability,
      });
    }
    return { ok: true, value: request.input };
  }
  const lastFrameFailure = await lastFrameFailureOf(options);
  if (lastFrameFailure !== undefined) {
    return { ok: false, failure: lastFrameFailure };
  }
  return inputWithCameraMove(request);
}
