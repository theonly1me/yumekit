import { randomUUID } from "node:crypto";
import type { Outcome } from "../../engineTypes.js";
import type { ChatLog } from "../chatLog.js";
import type { ChatFailure } from "../chatTypes.js";
import { accessFoldersOf } from "./accessFolders.js";
import { checkFileWith, type FileCheck } from "./fileCheck.js";
import { pathAccessOf } from "./fileAccess.js";
import {
  changeLeadPermissions,
  readLeadPermissions,
  withoutRepeats,
} from "./leadPermissionsFile.js";
import {
  keyOfAsk,
  permissionAskOf,
  type PermissionAsk,
  type ProgramToolCall,
} from "./permissionAsk.js";
import { allowReply, denyMessages, denyReplyOf } from "./permissionReplies.js";
import type { PermissionAnswer, PermissionEntry } from "./permissionSchemas.js";

export interface PermissionDesk {
  ask: (options: {
    call: ProgramToolCall;
    isLeadAtWork: boolean;
  }) => Promise<string>;
  checkFile: (check: FileCheck) => Promise<string>;
  answer: (options: {
    id: string;
    answer: PermissionAnswer;
  }) => Promise<Outcome<PermissionEntry, ChatFailure>>;
  endRequest: () => void;
}

type Waiting = (state: PermissionEntry["state"]) => void;

const stateOfAnswer: Record<PermissionAnswer, PermissionEntry["state"]> = {
  "allow-once": "allowed-once",
  "allow-for-project": "allowed-for-project",
  deny: "denied",
};

export function createPermissionDesk(options: {
  log: ChatLog;
  projectFolder: string;
  waitMilliseconds: number;
  onAnswered: () => void;
}): PermissionDesk {
  const { log, projectFolder } = options;
  const waiting = new Map<string, Waiting>();
  const once = new Set<string>();
  const onceFolders: string[] = [];
  const denied = new Set<string>();
  const foldersNow = () => accessFoldersOf({ projectFolder, onceFolders });
  const isStored = async (ask: PermissionAsk) => {
    const stored = await readLeadPermissions(projectFolder);
    return ask.rule !== undefined && stored.rules.includes(ask.rule);
  };
  const remember = async (options: {
    ask: PermissionAsk;
    state: PermissionEntry["state"];
  }) => {
    const { ask, state } = options;
    const key = keyOfAsk(ask);
    if (state === "allowed-once" || state === "allowed-for-project") {
      once.add(key);
      if (ask.folder !== undefined) onceFolders.push(ask.folder);
    } else {
      denied.add(key);
    }
    if (state !== "allowed-for-project") return;
    await changeLeadPermissions({
      projectFolder,
      change: (stored) => ({
        folders: withoutRepeats([
          ...stored.folders,
          ...(ask.folder === undefined ? [] : [ask.folder]),
        ]),
        rules: withoutRepeats([
          ...stored.rules,
          ...(ask.rule === undefined || ask.folder !== undefined
            ? []
            : [ask.rule]),
        ]),
      }),
    });
  };
  const waitForPerson = (ask: PermissionAsk) => {
    const entry: PermissionEntry = {
      kind: "permission",
      id: randomUUID(),
      what: ask.what,
      detail: ask.detail,
      ...(ask.folder === undefined ? {} : { folder: ask.folder }),
      canAllowForProject: ask.folder !== undefined || ask.rule !== undefined,
      askedAt: new Date().toISOString(),
      waitSeconds: Math.round(options.waitMilliseconds / 1000),
      state: "open",
    };
    log.put(entry);
    const answered = Promise.withResolvers<PermissionEntry["state"]>();
    const timer = setTimeout(() => {
      answered.resolve("timed-out");
    }, options.waitMilliseconds);
    waiting.set(entry.id, answered.resolve);
    return answered.promise.then((state) => {
      clearTimeout(timer);
      waiting.delete(entry.id);
      log.put({ ...entry, state });
      if (state !== "ended") options.onAnswered();
      return state;
    });
  };
  const replyOf = (state: PermissionEntry["state"]) => {
    if (state === "allowed-once" || state === "allowed-for-project") {
      return allowReply;
    }
    if (state === "timed-out") return denyReplyOf(denyMessages.noAnswer);
    if (state === "ended") return denyReplyOf(denyMessages.ended);
    return denyReplyOf(denyMessages.person);
  };
  return {
    ask: async ({ call, isLeadAtWork }) => {
      if (!isLeadAtWork) return denyReplyOf(denyMessages.nobody);
      const folders = await foldersNow();
      const ask = permissionAskOf({ call, folders });
      const folderAccess =
        ask.folder === undefined
          ? undefined
          : pathAccessOf({ path: ask.folder, folders }).kind;
      if (folderAccess === "closed") return denyReplyOf(denyMessages.keys);
      const key = keyOfAsk(ask);
      if (denied.has(key)) return denyReplyOf(denyMessages.earlier);
      const isAllowed =
        folderAccess === "open" || once.has(key) || (await isStored(ask));
      if (isAllowed) return allowReply;
      const state = await waitForPerson(ask);
      if (state !== "ended") await remember({ ask, state });
      return replyOf(state);
    },
    checkFile: async (check) =>
      checkFileWith({ check, folders: await foldersNow() }),
    answer: ({ id, answer }) => {
      const answerWith = waiting.get(id);
      const entry = log
        .entries()
        .find(
          (candidate): candidate is PermissionEntry =>
            candidate.kind === "permission" && candidate.id === id,
        );
      if (answerWith === undefined || entry === undefined) {
        return Promise.resolve({
          ok: false,
          failure: {
            kind: "permission-not-open",
            message: "This question is already answered.",
          },
        });
      }
      const state = stateOfAnswer[answer];
      answerWith(state);
      return Promise.resolve({ ok: true, value: { ...entry, state } });
    },
    endRequest: () => {
      for (const answerWith of waiting.values()) answerWith("ended");
      once.clear();
      denied.clear();
      onceFolders.length = 0;
    },
  };
}
