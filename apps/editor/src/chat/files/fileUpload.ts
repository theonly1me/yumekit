import type { EngineClient, Reply } from "../../engine/engineClient.js";

export type FileUpload = (upload: {
  file: File;
  actId: string;
}) => Promise<Reply<string>>;

export function assetUploadOf(client: EngineClient): FileUpload {
  return async (upload) => {
    const uploaded = await client.upload(upload);
    return uploaded.ok
      ? { ok: true, value: uploaded.value.asset.id }
      : uploaded;
  };
}
