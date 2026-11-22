import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importUpload } from "../uploads/importUpload.js";
import {
  isDeclaredTooLarge,
  receiveUpload,
  uploadLimitBytes,
} from "../uploads/receiveUpload.js";
import { safeUploadNameOf, shownUploadNameOf } from "../uploads/uploadName.js";
import type { Exchange, Route } from "./exchange.js";
import { sendJson, type Failure } from "./responses.js";

const uploadTooLarge: Failure = {
  status: 413,
  kind: "upload-too-large",
  message: `The file is larger than ${String(uploadLimitBytes / 1024 / 1024)} MB.`,
};

const nameNotValid: Failure = {
  status: 400,
  kind: "upload-name-not-valid",
  message:
    "The file needs a name with letters or digits, for example music.mp3.",
};

const endedEarly: Failure = {
  status: 400,
  kind: "body-not-read",
  message: "The file ended early.",
};

async function receiveAndImport(options: {
  exchange: Exchange;
  folder: string;
  fileName: string;
  shownName: string;
}): Promise<Failure | undefined> {
  const { exchange, fileName, shownName } = options;
  const file = join(options.folder, fileName);
  const received = await receiveUpload({ request: exchange.request, file });
  if (received.kind === "too-large") return uploadTooLarge;
  if (received.kind === "ended-early") return endedEarly;
  const imported = await importUpload({
    context: exchange.context,
    file,
    fileName,
    shownName,
  });
  if (!imported.ok) return imported.failure;
  sendJson({
    response: exchange.response,
    status: 200,
    body: { asset: imported.value },
  });
  return undefined;
}

async function upload(exchange: Exchange): Promise<Failure | undefined> {
  const fileName = safeUploadNameOf(exchange.query.get("name"));
  if (fileName === undefined || isDeclaredTooLarge(exchange.request)) {
    exchange.response.setHeader("Connection", "close");
    return fileName === undefined ? nameNotValid : uploadTooLarge;
  }
  const folder = await mkdtemp(join(tmpdir(), "yumekit-upload-"));
  try {
    const shownName = shownUploadNameOf(exchange.query.get("name"));
    return await receiveAndImport({ exchange, folder, fileName, shownName });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

export const uploadRoutes: Route[] = [
  { method: "POST", pattern: ["api", "uploads"], handle: upload },
];
