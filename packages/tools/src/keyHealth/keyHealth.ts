import type { StartedServer } from "../connectServer.js";
import type { KeyCheck } from "../types.js";

export const keyCheckCacheMilliseconds = 5 * 60 * 1000;

const rejectedKeyAnswer = /answered (401|403)\b/;

interface KeyState {
  works: boolean;
  message: string;
  checkedAtMilliseconds: number;
  fromRealCall: boolean;
}

export interface KeyHealth {
  problemOf: (connection: StartedServer) => string | undefined;
  needsCheck: (connection: StartedServer) => boolean;
  noteCheck: (options: { connection: StartedServer; check: KeyCheck }) => void;
  noteFailedCall: (options: {
    connection: StartedServer;
    message: string;
  }) => void;
  noteUsageLimit: (options: {
    connection: StartedServer;
    message: string;
  }) => void;
}

export function isRejectedKeyMessage(message: string): boolean {
  return rejectedKeyAnswer.test(message);
}

export function createKeyHealth(
  now: () => number = () => Date.now(),
): KeyHealth {
  const states = new WeakMap<StartedServer, KeyState>();
  return {
    problemOf: (connection) => {
      const state = states.get(connection);
      return state === undefined || state.works ? undefined : state.message;
    },
    needsCheck: (connection) => {
      const state = states.get(connection);
      if (state === undefined) return true;
      if (state.fromRealCall) return false;
      return now() - state.checkedAtMilliseconds >= keyCheckCacheMilliseconds;
    },
    noteCheck: ({ connection, check }) => {
      if (states.get(connection)?.fromRealCall === true) return;
      states.set(connection, {
        works: check.valid,
        message: check.message,
        checkedAtMilliseconds: now(),
        fromRealCall: false,
      });
    },
    noteFailedCall: ({ connection, message }) => {
      if (!isRejectedKeyMessage(message)) return;
      states.set(connection, {
        works: false,
        message,
        checkedAtMilliseconds: now(),
        fromRealCall: true,
      });
    },
    noteUsageLimit: ({ connection, message }) => {
      states.set(connection, {
        works: false,
        message,
        checkedAtMilliseconds: now(),
        fromRealCall: false,
      });
    },
  };
}
