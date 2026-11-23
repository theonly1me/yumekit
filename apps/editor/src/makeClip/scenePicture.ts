import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset } from "../engine/snapshot.js";
import { stillOfScene } from "../parts/pictures/pictureFiles.js";
import { failureTextOf } from "../tools/requestText.js";
import type { ToolFailure } from "./toolCalls.js";

export type ScenePicture =
  | { kind: "loading" }
  | { kind: "ready"; blob: Blob; url: string }
  | { kind: "failed"; message: string };

export function useScenePicture(options: {
  client: EngineClient;
  outputId: string;
  sceneId: string;
  sceneKey: string;
}): ScenePicture {
  const { client, outputId, sceneId, sceneKey } = options;
  const [picture, setPicture] = useState<{
    key: string;
    picture: ScenePicture;
  }>();
  const key = `${outputId}/${sceneId}/${sceneKey}`;

  useEffect(() => {
    let isCurrent = true;
    let url: string | undefined;
    stillOfScene({ client, outputId, sceneId })
      .then((made) => {
        if (!isCurrent) return;
        if (made.kind === "failed") {
          setPicture({ key, picture: made });
          return;
        }
        url = URL.createObjectURL(made.blob);
        setPicture({ key, picture: { kind: "ready", blob: made.blob, url } });
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setPicture({
            key,
            picture: { kind: "failed", message: String(error) },
          });
        }
      });
    return () => {
      isCurrent = false;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [client, outputId, sceneId, key]);

  return picture?.key === key ? picture.picture : { kind: "loading" };
}

async function contentHashOf(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export async function assetOfScenePicture(options: {
  client: EngineClient;
  blob: Blob;
  assets: Asset[];
  name: string;
  actId: string;
}): Promise<
  { ok: true; assetId: string } | { ok: false; failure: ToolFailure }
> {
  const contentHash = await contentHashOf(options.blob);
  const made = options.assets.find(
    (asset) => asset.contentHash === contentHash,
  );
  if (made !== undefined) return { ok: true, assetId: made.id };
  const uploaded = await options.client.upload({
    file: new File([options.blob], `${options.name}.png`, {
      type: "image/png",
    }),
    actId: options.actId,
  });
  return uploaded.ok
    ? { ok: true, assetId: uploaded.value.asset.id }
    : {
        ok: false,
        failure: {
          kind: "picture-not-saved",
          message: failureTextOf(uploaded.failure),
        },
      };
}
