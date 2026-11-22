import type { EngineClient } from "../../engine/engineClient.js";
import type { Output } from "../../engine/snapshot.js";
import { failureTextOf } from "../../tools/requestText.js";
import { stillFrameOf } from "../../scenes/useSceneStills.js";
import type { PictureCard } from "./usePictureCards.js";

export type FileOutcome =
  { kind: "done"; blob: Blob } | { kind: "failed"; message: string };

export type UploadOutcome =
  { kind: "done"; fileName: string } | { kind: "failed"; message: string };

const uploadTooLargeText =
  "This file is larger than 500 megabytes. Pick a smaller picture.";

function blobOfBase64(options: { base64: string; mimeType: string }): Blob {
  const bytes = Uint8Array.from(atob(options.base64), (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: options.mimeType });
}

function fileNameOf(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}

async function stillOfClip(options: {
  client: EngineClient;
  output: Output;
  frame: number;
}): Promise<FileOutcome> {
  const { client } = options;
  const rendered = await client.callTool({
    name: "render_still",
    input: { output_id: options.output.id, frame: options.frame },
  });
  if (!rendered.ok)
    return { kind: "failed", message: failureTextOf(rendered.failure) };
  const file = rendered.value.data["file"];
  if (rendered.value.isError || typeof file !== "string") {
    return { kind: "failed", message: rendered.value.text };
  }
  const sent = await client.renderFile(fileNameOf(file));
  if (!sent.ok) return { kind: "failed", message: failureTextOf(sent.failure) };
  return { kind: "done", blob: await sent.value.blob() };
}

async function stillOfScene(options: {
  client: EngineClient;
  output: Output;
  sceneId: string;
}): Promise<FileOutcome> {
  const reply = await options.client.callTool({
    name: "preview_scenes",
    input: {
      output_id: options.output.id,
      scene_ids: [options.sceneId],
      scale: 1,
    },
  });
  if (!reply.ok)
    return { kind: "failed", message: failureTextOf(reply.failure) };
  const [image] = reply.value.images;
  if (reply.value.isError || image === undefined) {
    return { kind: "failed", message: reply.value.text };
  }
  return { kind: "done", blob: blobOfBase64(image) };
}

export function fullPictureOf(options: {
  client: EngineClient;
  output: Output;
  card: PictureCard;
}): Promise<FileOutcome> {
  const { client, output, card } = options;
  return card.clip === undefined
    ? stillOfScene({ client, output, sceneId: card.scene.id })
    : stillOfClip({ client, output, frame: stillFrameOf(card.clip) });
}

export async function uploadPicture(options: {
  client: EngineClient;
  file: File;
}): Promise<UploadOutcome> {
  const uploaded = await options.client.upload(options.file);
  if (uploaded.ok) {
    const { source } = uploaded.value.asset;
    return {
      kind: "done",
      fileName:
        source.kind === "import" ? source.originalName : options.file.name,
    };
  }
  const { failure } = uploaded;
  const isTooLarge =
    failure.kind === "request-failed" &&
    failure.engineKind === "upload-too-large";
  return {
    kind: "failed",
    message: isTooLarge ? uploadTooLargeText : failureTextOf(failure),
  };
}
