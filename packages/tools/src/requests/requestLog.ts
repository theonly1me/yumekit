import { realpath } from "node:fs/promises";
import type { MediaToolRequest, MediaTools, Outcome } from "../types.js";
import {
  mostRequestsKept,
  readRequestFile,
  requestFileOf,
  writeRequestFile,
  type MediaRequestRecord,
  type RequestLogNotValid,
} from "./requestFile.js";
import { withoutKeyValues, type KeyValue } from "./keyValues.js";
import {
  pathsOf,
  projectFileOf,
  requestRecordOf,
  type CallOutcome,
  type FileOf,
} from "./requestRecord.js";

export interface RequestLog {
  addCall: (call: {
    request: MediaToolRequest;
    startedAt: Date;
    outcome: CallOutcome;
  }) => Promise<void>;
  newestFirst: () => Promise<Outcome<MediaRequestRecord[], RequestLogNotValid>>;
}

function withoutKeysInRecord(options: {
  record: MediaRequestRecord;
  keys: KeyValue[];
}): MediaRequestRecord {
  const { record, keys } = options;
  return {
    ...record,
    ...(record.prompt_from_you === undefined
      ? {}
      : {
          prompt_from_you: withoutKeyValues({
            text: record.prompt_from_you,
            keys,
          }),
        }),
    ...(record.failure === undefined
      ? {}
      : {
          failure: {
            kind: record.failure.kind,
            message: withoutKeyValues({ text: record.failure.message, keys }),
          },
        }),
  };
}

export function createRequestLog(options: {
  projectFolder: string;
  keyValues: () => KeyValue[];
}): RequestLog {
  const { projectFolder } = options;
  const file = requestFileOf(projectFolder);
  let writes: Promise<void> = Promise.resolve();
  const realFolder = realpath(projectFolder).catch(() => projectFolder);

  const fileOfCall = async (call: {
    request: MediaToolRequest;
    outcome: CallOutcome;
  }): Promise<FileOf> => {
    const folder = await realFolder;
    const paths = pathsOf(call);
    const reals = await Promise.all(
      paths.map((path) => realpath(path).catch(() => path)),
    );
    const realByPath = new Map(
      paths.map((...[path, index]) => [path, reals[index] ?? path]),
    );
    return (path) =>
      projectFileOf({
        projectFolders: [folder, projectFolder],
        path: realByPath.get(path) ?? path,
      });
  };

  const append = (record: MediaRequestRecord): Promise<void> => {
    const written = writes.then(async () => {
      const kept = await readRequestFile(file);
      if (!kept.ok) return;
      await writeRequestFile({
        file,
        requests: [...kept.value, record].slice(-mostRequestsKept),
      });
    });
    writes = written.catch(() => undefined);
    return writes;
  };

  return {
    addCall: async (call) => {
      const endedAt = new Date();
      const fileOf = await fileOfCall(call);
      const record = requestRecordOf({ fileOf, endedAt, ...call });
      await append(withoutKeysInRecord({ record, keys: options.keyValues() }));
    },
    newestFirst: async () => {
      await writes;
      const read = await readRequestFile(file);
      return read.ok ? { ok: true, value: [...read.value].reverse() } : read;
    },
  };
}

export function requestMethodsOf(
  log: RequestLog,
): Pick<MediaTools, "requests" | "recordRefusal"> {
  return {
    requests: () => log.newestFirst(),
    recordRefusal: (refusal) =>
      log.addCall({
        request: refusal.request,
        startedAt: new Date(),
        outcome: { kind: "failed", failure: refusal.failure },
      }),
  };
}
