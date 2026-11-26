import { useCallback, useEffect, useState } from "react";
import type { EngineClient, Reply } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";
import {
  addLeadFolder,
  readLeadAccess,
  removeLeadFolder,
  removeLeadRule,
  saveLeadAccess,
  type LeadAccess,
  type LeadAccessChoice,
} from "./leadAccessRequests.js";

export type LeadAccessState =
  | { kind: "loading" }
  | { kind: "ready"; lead: LeadAccess }
  | { kind: "failed"; message: string };

export function useLeadAccess(client: EngineClient) {
  const [state, setState] = useState<LeadAccessState>({ kind: "loading" });

  const take = useCallback((reply: Reply<LeadAccess>): string | undefined => {
    if (!reply.ok) return failureTextOf(reply.failure);
    setState({ kind: "ready", lead: reply.value });
    return undefined;
  }, []);

  useEffect(() => {
    readLeadAccess(client).then(
      (reply) => {
        if (reply.ok) take(reply);
        else
          setState({ kind: "failed", message: failureTextOf(reply.failure) });
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [client, take]);

  return {
    state,
    choose: async (access: LeadAccessChoice) =>
      take(await saveLeadAccess({ client, access })),
    addFolder: async (folder: string) =>
      take(await addLeadFolder({ client, folder })),
    removeFolder: async (folder: string) =>
      take(await removeLeadFolder({ client, folder })),
    removeRule: async (rule: string) =>
      take(await removeLeadRule({ client, rule })),
  };
}

export type LeadAccessActions = ReturnType<typeof useLeadAccess>;
