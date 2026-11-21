import { useEffect, useState } from "react";
import type { ClientFailure, EngineClient } from "./engineClient.js";
import type { Snapshot } from "./snapshot.js";

export type ProjectState =
  | { kind: "loading" }
  | { kind: "ready"; snapshot: Snapshot; projectFolder: string }
  | { kind: "failed"; failure: ClientFailure };

const firstReconnectMilliseconds = 500;
const longestReconnectMilliseconds = 5_000;

function isProjectChanged(data: unknown): boolean {
  if (typeof data !== "string") return false;
  let message: unknown;
  try {
    message = JSON.parse(data);
  } catch {
    return false;
  }
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "project-changed"
  );
}

export function useProject(client: EngineClient): ProjectState {
  const [state, setState] = useState<ProjectState>({ kind: "loading" });

  useEffect(() => {
    let isClosed = false;
    let loadNumber = 0;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let reconnectDelay = firstReconnectMilliseconds;
    let isTokenRejected = false;

    async function load(): Promise<void> {
      loadNumber += 1;
      const thisLoad = loadNumber;
      const [health, project] = await Promise.all([
        client.health(),
        client.project(),
      ]);
      if (isClosed || thisLoad !== loadNumber) return;
      const failed = !health.ok ? health : !project.ok ? project : undefined;
      if (failed !== undefined) {
        isTokenRejected = failed.failure.kind === "token-rejected";
        setState({ kind: "failed", failure: failed.failure });
        return;
      }
      if (health.ok && project.ok) {
        setState({
          kind: "ready",
          snapshot: project.value,
          projectFolder: health.value.projectFolder,
        });
      }
    }

    function reload(): void {
      load().catch((error: unknown) => {
        setState({
          kind: "failed",
          failure: { kind: "request-failed", message: String(error) },
        });
      });
    }

    function connect(): void {
      socket = new WebSocket(client.eventsUrl());
      socket.addEventListener("open", () => {
        reconnectDelay = firstReconnectMilliseconds;
        reload();
      });
      socket.addEventListener("message", (event) => {
        if (isProjectChanged(event.data)) reload();
      });
      socket.addEventListener("close", () => {
        if (isClosed) return;
        reload();
        if (isTokenRejected) return;
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(
          reconnectDelay * 2,
          longestReconnectMilliseconds,
        );
      });
    }

    connect();
    return () => {
      isClosed = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [client]);

  return state;
}
