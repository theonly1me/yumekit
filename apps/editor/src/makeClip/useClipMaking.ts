import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { useLeadMaking } from "../lead/useLeadMaking.js";
import type { ClipDraft } from "./ClipForm.js";
import { outputsHoldingClip } from "./clipOutputs.js";
import { clipRequestOf, madeClipOf, type MadeClip } from "./makeClip.js";
import {
  takesFirstPicture,
  takesLastPicture,
  type ModelChoice,
} from "./modelChoices.js";
import { assetOfScenePicture, type ScenePicture } from "./scenePicture.js";
import type { SettingValues } from "./settingValues.js";

export type FirstPicture =
  { kind: "scene" } | { kind: "asset"; assetId: string };

async function firstAssetOf(options: {
  client: EngineClient;
  snapshot: Snapshot;
  firstPicture: FirstPicture;
  scenePicture: ScenePicture;
  sceneName: string;
}): Promise<
  | { ok: true; assetId: string }
  | { ok: false; failure: { kind: string; message: string } }
> {
  const { firstPicture, scenePicture } = options;
  if (firstPicture.kind === "asset") {
    return { ok: true, assetId: firstPicture.assetId };
  }
  if (scenePicture.kind !== "ready") {
    return {
      ok: false,
      failure: {
        kind: "picture-not-ready",
        message: "The picture of the scene is not ready.",
      },
    };
  }
  return assetOfScenePicture({
    client: options.client,
    blob: scenePicture.blob,
    assets: options.snapshot.assets,
    name: options.sceneName,
    actId: crypto.randomUUID(),
  });
}

export function useClipMaking(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  target: SceneClip;
  sceneName: string;
  scenePicture: ScenePicture;
  onMade: () => Promise<void>;
}) {
  const { client, snapshot, output, target } = options;
  const making = useLeadMaking<MadeClip>({
    client,
    onFinished: options.onMade,
  });

  const run = async (request: {
    choice: ModelChoice;
    values: SettingValues;
    draft: ClipDraft;
  }) => {
    const { choice, draft } = request;
    const takesPicture = takesFirstPicture(choice.model);
    const first = takesPicture
      ? await firstAssetOf({ ...options, firstPicture: draft.firstPicture })
      : undefined;
    if (first !== undefined && !first.ok) {
      making.fail(first.failure);
      return;
    }
    const outputs = outputsHoldingClip({
      snapshot,
      clipId: target.id,
      currentOutput: output,
    });
    const { assetId, request: exact } = clipRequestOf({
      choice,
      prompt: draft.prompt.trim(),
      values: request.values,
      firstFrameAssetId: first?.assetId,
      lastFrameAssetId:
        takesPicture && takesLastPicture(choice.model)
          ? draft.lastFrameId
          : undefined,
      cameraMoveId: draft.cameraMoveId,
      referenceAssetIds: draft.referenceIds,
      outputs,
      clip: target,
      assets: snapshot.assets,
    });
    making.make({
      exact,
      find: (latest) =>
        madeClipOf({ snapshot: latest, assetId, clip: target, outputs }),
    });
  };

  const make = (request: Parameters<typeof run>[0]) => {
    if (making.phase.kind === "making") return;
    making.begin();
    run(request).catch((error: unknown) => {
      making.fail({ kind: "defect", message: String(error) });
    });
  };

  return {
    phase: making.phase,
    readiness: making.readiness,
    reset: making.reset,
    make,
  };
}
