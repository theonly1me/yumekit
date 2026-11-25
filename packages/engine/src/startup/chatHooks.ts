import {
  noCriticFailure,
  noPersonFailure,
  type AskCritic,
  type AskHelper,
  type AskPerson,
} from "@yumekit/harness-mcp";
import type { Chat } from "../chat/chat.js";
import { noChatHelper } from "../chat/helpers/helperDesk.js";

export interface ChatHooks {
  askHelper: AskHelper;
  askCritic: AskCritic;
  askPerson: AskPerson;
}

export function chatHooksOf(chat: { current: Chat | undefined }): ChatHooks {
  return {
    askHelper: (request) => chat.current?.askHelper(request) ?? noChatHelper,
    askCritic: (request) =>
      chat.current?.askCritic(request) ??
      Promise.resolve({ ok: false, failure: noCriticFailure }),
    askPerson: (questions) =>
      chat.current?.askPerson(questions) ??
      Promise.resolve({ ok: false, failure: noPersonFailure }),
  };
}
