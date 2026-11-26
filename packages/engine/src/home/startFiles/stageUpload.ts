import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Exchange } from "../../http/exchange.js";
import { sendJson, type Failure } from "../../http/responses.js";
import {
  isDeclaredTooLarge,
  receiveUpload,
  uploadLimitBytes,
} from "../../uploads/receiveUpload.js";
import {
  safeUploadNameOf,
  shownUploadNameOf,
} from "../../uploads/uploadName.js";
import type { HomeContext } from "../homeContext.js";

export interface StagedUpload {
  file: string;
  name: string;
}

export interface StartFiles {
  folder: string;
  staged: Map<string, StagedUpload>;
}

const nameNotValid: Failure = {
  status: 400,
  kind: "upload-name-not-valid",
  message:
    "The file needs a name with letters or digits, for example music.mp3.",
};

const tooLarge: Failure = {
  status: 413,
  kind: "upload-too-large",
  message: `The file is larger than ${String(uploadLimitBytes / 1024 / 1024)} MB.`,
};

const endedEarly: Failure = {
  status: 400,
  kind: "body-not-read",
  message: "The file ended early.",
};

export async function stageUpload(
  exchange: Exchange<HomeContext>,
): Promise<Failure | undefined> {
  const fileName = safeUploadNameOf(exchange.query.get("name"));
  if (fileName === undefined || isDeclaredTooLarge(exchange.request)) {
    exchange.response.setHeader("Connection", "close");
    return fileName === undefined ? nameNotValid : tooLarge;
  }
  const { startFiles } = exchange.context;
  const id = randomUUID();
  const folder = join(startFiles.folder, id);
  await mkdir(folder, { recursive: true });
  const file = join(folder, fileName);
  const received = await receiveUpload({ request: exchange.request, file });
  if (received.kind !== "received") {
    await rm(folder, { recursive: true, force: true });
    return received.kind === "too-large" ? tooLarge : endedEarly;
  }
  const name = shownUploadNameOf(exchange.query.get("name"));
  startFiles.staged.set(id, { file, name });
  sendJson({
    response: exchange.response,
    status: 200,
    body: { upload: { id, name } },
  });
  return undefined;
}
