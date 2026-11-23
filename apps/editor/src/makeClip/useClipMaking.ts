import { useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import type { Phase } from "./ClipAction.js";
import type { ClipDraft } from "./ClipForm.js";
import { outputsHoldingClip } from "./clipOutputs.js";
import { makeClip, type MakeOutcome } from "./makeClip.js";
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
  actId: string;
}): Promise<MakeOutcome | { ok: true; assetId: string }> {
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
    actId: options.actId,
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
  const callId = useRef("");
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type !== "call-progress" || event.callId !== callId.current) {
        return;
      }
      setPhase((current) =>
        current.kind === "making"
          ? { kind: "making", progress: event }
          : current,
      );
    },
  });

  const run = async (request: {
    choice: ModelChoice;
    values: SettingValues;
    draft: ClipDraft;
  }): Promise<MakeOutcome> => {
    const { choice, draft } = request;
    const takesPicture = takesFirstPicture(choice.model);
    const first = takesPicture
      ? await firstAssetOf({
          ...options,
          firstPicture: draft.firstPicture,
          actId: callId.current,
        })
      : undefined;
    if (first !== undefined && !first.ok) return first;
    return makeClip({
      client,
      choice,
      prompt: draft.prompt.trim(),
      values: request.values,
      firstFrameAssetId:
        first !== undefined && "assetId" in first ? first.assetId : undefined,
      lastFrameAssetId:
        takesPicture && takesLastPicture(choice.model)
          ? draft.lastFrameId
          : undefined,
      cameraMoveId: draft.cameraMoveId,
      referenceAssetIds: draft.referenceIds,
      outputs: outputsHoldingClip({
        snapshot,
        clipId: target.id,
        currentOutput: output,
      }),
      clip: target,
      assets: snapshot.assets,
      callId: callId.current,
    });
  };

  const make = (request: Parameters<typeof run>[0]) => {
    if (phase.kind === "making") return;
    callId.current = crypto.randomUUID();
    setPhase({ kind: "making", progress: undefined });
    run(request)
      .then(async (outcome) => {
        setPhase(
          outcome.ok
            ? { kind: "made", made: outcome.made }
            : { kind: "failed", failure: outcome.failure },
        );
        await options.onMade();
      })
      .catch((error: unknown) => {
        setPhase({
          kind: "failed",
          failure: { kind: "defect", message: String(error) },
        });
      });
  };

  return { phase, setPhase, make };
}
