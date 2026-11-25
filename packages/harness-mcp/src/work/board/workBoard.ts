import type { HarnessFailure, Outcome } from "../../results.js";
import { busyFailureOf } from "./busyFailure.js";

export type WorkState = "waiting" | "running";

export interface WorkItem {
  id: string;
  kind: "media" | "review";
  what: string;
  subject: string;
  shotId?: string;
  castId?: string;
  server?: string;
  state: WorkState;
  startedAt: string;
  videoSeconds: number;
}

export type WorkStart = Omit<WorkItem, "state" | "startedAt"> & {
  state?: WorkState;
};

export interface WorkTicket {
  update: (change: { server?: string; state?: WorkState }) => void;
  finish: () => void;
}

export interface WorkBoard {
  start: (item: WorkStart) => Outcome<WorkTicket, HarnessFailure>;
  items: () => WorkItem[];
  reservedVideoSeconds: () => number;
  subscribe: (listener: (items: WorkItem[]) => void) => () => void;
}

export function createWorkBoard(): WorkBoard {
  const items = new Map<string, WorkItem>();
  const listeners = new Set<(items: WorkItem[]) => void>();
  const listOf = () => [...items.values()];
  const tell = () => {
    const list = listOf();
    listeners.forEach((listener) => {
      listener(list);
    });
  };
  return {
    start: (start) => {
      const busy = busyFailureOf({ items: listOf(), start });
      if (busy !== undefined) return { ok: false, failure: busy };
      const key = `${start.kind}:${start.id}`;
      items.set(key, {
        ...start,
        state: start.state ?? "running",
        startedAt: new Date().toISOString(),
      });
      tell();
      return {
        ok: true,
        value: {
          update: (change) => {
            const item = items.get(key);
            if (item === undefined) return;
            items.set(key, { ...item, ...change });
            tell();
          },
          finish: () => {
            items.delete(key);
            tell();
          },
        },
      };
    },
    items: listOf,
    reservedVideoSeconds: () =>
      listOf().reduce((...[total, item]) => total + item.videoSeconds, 0),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
