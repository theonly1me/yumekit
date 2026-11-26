import { join } from "node:path";
import { readOptionalFile, writeFileAtomic } from "../agents/agentFiles.js";
import { chatFileSchema, type ChatEntry, type ChatFile } from "./chatTypes.js";

export function chatFilePath(projectFolder: string): string {
  return join(projectFolder, ".yumekit", "chat", "chat.json");
}

const emptyChat: ChatFile = { sessionId: null, entries: [], redoChangeIds: [] };

function parsedChatOf(text: string): ChatFile {
  try {
    const parsed = chatFileSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : emptyChat;
  } catch {
    return emptyChat;
  }
}

function stoppedIfRunning(entry: ChatEntry): ChatEntry {
  if (entry.kind === "permission" && entry.state === "open") {
    return { ...entry, state: "ended" };
  }
  return entry.kind === "answer" && entry.state === "running"
    ? { ...entry, state: "stopped" }
    : entry;
}

export async function loadChat(projectFolder: string): Promise<ChatFile> {
  const read = await readOptionalFile(chatFilePath(projectFolder));
  if (!read.ok || read.value === undefined) return emptyChat;
  const chat = parsedChatOf(read.value);
  return { ...chat, entries: chat.entries.map(stoppedIfRunning) };
}

export function createChatSaver(projectFolder: string): {
  save: (chat: ChatFile) => void;
  flush: () => Promise<void>;
} {
  let saving: Promise<void> = Promise.resolve();
  return {
    save: (chat) => {
      const content = `${JSON.stringify(chat, null, 2)}\n`;
      saving = saving
        .then(() =>
          writeFileAtomic({ file: chatFilePath(projectFolder), content }),
        )
        .then(() => undefined);
    },
    flush: () => saving,
  };
}
