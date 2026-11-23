import { extname } from "node:path";
import { probeMedia } from "@yumekit/render";
import type { Asset } from "@yumekit/project";
import type { Outcome } from "../engineTypes.js";
import type { EngineContext } from "../http/exchange.js";
import type { Failure } from "../http/responses.js";
import { uploadAssetIdOf } from "./uploadName.js";

type UploadKind = "image" | "audio" | "video";

const notMedia: Failure = {
  status: 400,
  kind: "file-type-not-supported",
  message: "This file is not a picture, a sound, or a video.",
};

async function kindOf(file: string): Promise<Outcome<UploadKind, Failure>> {
  if (extname(file).toLowerCase() === ".svg") {
    return { ok: true, value: "image" };
  }
  const probed = await probeMedia({ file });
  if (probed.ok) return { ok: true, value: probed.value.kind };
  if (probed.failure.kind === "media-not-readable") {
    return { ok: false, failure: notMedia };
  }
  return {
    ok: false,
    failure: {
      status: 500,
      kind: probed.failure.kind,
      message: [probed.failure.message, probed.failure.hint ?? ""]
        .join(" ")
        .trim(),
    },
  };
}

function textOf(options: { value: unknown; fallback: string }): string {
  return typeof options.value === "string" ? options.value : options.fallback;
}

export async function importUpload(options: {
  context: EngineContext;
  file: string;
  fileName: string;
  shownName: string;
  actId: string | undefined;
}): Promise<Outcome<Asset, Failure>> {
  const { context, file } = options;
  const kind = await kindOf(file);
  if (!kind.ok) return kind;
  const assetId = uploadAssetIdOf({
    fileName: options.fileName,
    takenIds: context.store.read().assets.map((asset) => asset.id),
  });
  const result = await context.chat.runToolCall({
    caller: {
      by: "person",
      tool: "import_asset",
      ...(options.actId === undefined ? {} : { actId: options.actId }),
    },
    call: () =>
      context.harness.call({
        name: "import_asset",
        by: "person",
        input: {
          asset_id: assetId,
          kind: kind.value,
          source_path: file,
          original_name: options.shownName,
        },
      }),
  });
  const asset = context.store
    .read()
    .assets.find((candidate) => candidate.id === assetId);
  if (!result.isError && asset !== undefined) return { ok: true, value: asset };
  return {
    ok: false,
    failure: {
      status: 400,
      kind: textOf({ value: result.data["kind"], fallback: "upload-failed" }),
      message: textOf({ value: result.data["message"], fallback: result.text }),
    },
  };
}
