import { openAsBlob } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type { Outcome } from "../../engineTypes.js";
import {
  failureOf,
  type FirstRequestFailure,
  type StartFile,
} from "../firstRequest.js";
import type { EngineAddress } from "../homeTypes.js";
import type { StartFiles } from "./stageUpload.js";

export const startFileSchema = z.strictObject({
  upload_id: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(200),
});

export type StartFileInput = z.infer<typeof startFileSchema>;

const addedSchema = z.object({ asset: z.object({ id: z.string() }) });

const fileGone: FirstRequestFailure = {
  kind: "start-file-not-found",
  message: "A file of the start box is gone. Add it again in the chat.",
};

async function addOne(options: {
  engine: EngineAddress;
  startFiles: StartFiles;
  input: StartFileInput;
}): Promise<Outcome<StartFile, FirstRequestFailure>> {
  const staged = options.startFiles.staged.get(options.input.upload_id);
  if (staged === undefined) return { ok: false, failure: fileGone };
  const query = new URLSearchParams({ name: staged.name }).toString();
  const response = await fetch(
    `${options.engine.origin}/api/uploads?${query}`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${options.engine.token}` },
      body: await openAsBlob(staged.file),
    },
  ).catch(() => undefined);
  if (response === undefined) return { ok: false, failure: fileGone };
  if (response.status !== 200) {
    return { ok: false, failure: await failureOf(response) };
  }
  const added = addedSchema.safeParse(await response.json());
  if (!added.success) return { ok: false, failure: fileGone };
  options.startFiles.staged.delete(options.input.upload_id);
  await rm(dirname(staged.file), { recursive: true, force: true });
  return {
    ok: true,
    value: { asset_id: added.data.asset.id, name: options.input.name },
  };
}

export async function addStartFiles(options: {
  engine: EngineAddress;
  startFiles: StartFiles;
  files: StartFileInput[];
}): Promise<Outcome<StartFile[], FirstRequestFailure>> {
  const added: StartFile[] = [];
  for (const input of options.files) {
    const one = await addOne({ ...options, input });
    if (!one.ok) return one;
    added.push(one.value);
  }
  return { ok: true, value: added };
}
