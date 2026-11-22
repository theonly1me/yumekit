import type { EventHub } from "../events/eventHub.js";
import { createChatSaver } from "./chatFile.js";
import type { ChatEntry, ChatFile } from "./chatTypes.js";

export interface ChatLog {
  entries: () => ChatEntry[];
  put: (entry: ChatEntry) => void;
  sendText: (options: { id: string; text: string }) => void;
  sessionId: () => string | undefined;
  setSessionId: (sessionId: string | undefined) => void;
  pushRedo: (changeId: string) => void;
  popRedo: () => string | undefined;
  clearRedo: () => void;
  flush: () => Promise<void>;
}

export function createChatLog(options: {
  projectFolder: string;
  chat: ChatFile;
  events: EventHub;
}): ChatLog {
  const saver = createChatSaver(options.projectFolder);
  let chat = options.chat;
  const save = () => {
    saver.save(chat);
  };
  return {
    entries: () => chat.entries,
    put: (entry) => {
      const exists = chat.entries.some((current) => current.id === entry.id);
      chat = {
        ...chat,
        entries: exists
          ? chat.entries.map((current) =>
              current.id === entry.id ? entry : current,
            )
          : [...chat.entries, entry],
      };
      options.events.send({ type: "chat-changed", entry });
      save();
    },
    sendText: ({ id, text }) => {
      options.events.send({ type: "chat-text", id, text });
    },
    sessionId: () => chat.sessionId ?? undefined,
    setSessionId: (sessionId) => {
      chat = { ...chat, sessionId: sessionId ?? null };
      save();
    },
    pushRedo: (changeId) => {
      chat = { ...chat, redoChangeIds: [...chat.redoChangeIds, changeId] };
      save();
    },
    popRedo: () => {
      const changeId = chat.redoChangeIds.at(-1);
      chat = { ...chat, redoChangeIds: chat.redoChangeIds.slice(0, -1) };
      save();
      return changeId;
    },
    clearRedo: () => {
      if (chat.redoChangeIds.length === 0) return;
      chat = { ...chat, redoChangeIds: [] };
      save();
    },
    flush: () => saver.flush(),
  };
}
