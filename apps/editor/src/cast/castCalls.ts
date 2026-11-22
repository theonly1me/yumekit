import type { EngineClient } from "../engine/engineClient.js";
import { callTool, type ToolFailure } from "../makeClip/toolCalls.js";
import { failureTextOf } from "../tools/requestText.js";
import type { CastEntry } from "./castEntries.js";

export type CastCallOutcome = { ok: true } | { ok: false; message: string };

export type UploadOutcome =
  { ok: true; assetId: string } | { ok: false; message: string };

function messageOf(failure: ToolFailure): string {
  return failure.hint === undefined
    ? failure.message
    : `${failure.message} ${failure.hint}`;
}

export async function saveCastEntry(options: {
  client: EngineClient;
  entry: CastEntry;
}): Promise<CastCallOutcome> {
  const { entry } = options;
  const called = await callTool({
    client: options.client,
    name: "put_cast_member",
    input: {
      cast_id: entry.id,
      kind: entry.kind,
      name: entry.name,
      description: entry.description,
      reference_asset_ids: entry.referenceAssetIds,
    },
  });
  return called.ok
    ? { ok: true }
    : { ok: false, message: messageOf(called.failure) };
}

export async function removeCastEntry(options: {
  client: EngineClient;
  castId: string;
}): Promise<CastCallOutcome> {
  const called = await callTool({
    client: options.client,
    name: "remove_cast_member",
    input: { cast_id: options.castId },
  });
  return called.ok
    ? { ok: true }
    : { ok: false, message: messageOf(called.failure) };
}

export async function uploadPicture(options: {
  client: EngineClient;
  file: File;
}): Promise<UploadOutcome> {
  const uploaded = await options.client.upload(options.file);
  if (!uploaded.ok) {
    return { ok: false, message: failureTextOf(uploaded.failure) };
  }
  const { asset } = uploaded.value;
  if (asset.kind !== "image") {
    return { ok: false, message: "This file is not a picture." };
  }
  return { ok: true, assetId: asset.id };
}
