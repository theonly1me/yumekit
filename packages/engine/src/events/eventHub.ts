import { STATUS_CODES, type IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { WebSocket, WebSocketServer } from "ws";
import type { EngineEvent } from "../engineTypes.js";
import {
  siteRejectionOf,
  tokenRejectionOf,
  type Rejection,
} from "../http/requestChecks.js";
import { requestPathOf } from "../http/requestPath.js";

export interface Upgrade {
  request: IncomingMessage;
  socket: Duplex;
  head: Buffer;
}

export interface EventHub {
  handleUpgrade: (upgrade: Upgrade) => void;
  send: (event: EngineEvent) => void;
  agentConnectionCount: () => number;
  close: () => Promise<void>;
}

const closeWaitMilliseconds = 1_000;

function upgradeRejectionOf(options: {
  request: IncomingMessage;
  port: number;
  token: string;
}): Rejection | undefined {
  const path = requestPathOf(options.request.url);
  if (!path.ok) return path.failure;
  if (path.value.segments.join("/") !== "api/events") {
    return { status: 404, kind: "not-found", message: "No such event path." };
  }
  return (
    siteRejectionOf(options) ??
    tokenRejectionOf({
      given: path.value.query.get("token") ?? undefined,
      token: options.token,
    })
  );
}

function isAgentConnection(request: IncomingMessage): boolean {
  const path = requestPathOf(request.url);
  return path.ok && path.value.query.get("client") === "agent";
}

function rejectUpgrade(options: {
  socket: Duplex;
  rejection: Rejection;
}): void {
  const { status, kind, message } = options.rejection;
  const body = JSON.stringify({ kind, message });
  options.socket.end(
    [
      `HTTP/1.1 ${String(status)} ${STATUS_CODES[status] ?? ""}`,
      "Connection: close",
      "Content-Type: application/json; charset=utf-8",
      `Content-Length: ${String(Buffer.byteLength(body))}`,
      "",
      body,
    ].join("\r\n"),
  );
}

export function createEventHub(options: {
  port: number;
  token: string;
}): EventHub {
  const server = new WebSocketServer({
    noServer: true,
    clientTracking: true,
    maxPayload: 1024,
  });
  const openClients = () =>
    [...server.clients].filter(
      (client) => client.readyState === WebSocket.OPEN,
    );
  const send = (event: EngineEvent) => {
    const text = JSON.stringify(event);
    for (const client of openClients()) {
      client.send(text);
    }
  };
  const agentClients = new Set<WebSocket>();
  const countAgent = (options: { client: WebSocket; isOpen: boolean }) => {
    if (options.isOpen) agentClients.add(options.client);
    else agentClients.delete(options.client);
    send({ type: "agents-changed", connected: agentClients.size });
  };
  return {
    handleUpgrade: ({ request, socket, head }) => {
      socket.on("error", () => {
        socket.destroy();
      });
      const rejection = upgradeRejectionOf({ request, ...options });
      if (rejection !== undefined) {
        rejectUpgrade({ socket, rejection });
        return;
      }
      const isAgent = isAgentConnection(request);
      server.handleUpgrade(request, socket, head, (client) => {
        client.on("error", () => {
          client.terminate();
        });
        if (!isAgent) return;
        client.on("close", () => {
          countAgent({ client, isOpen: false });
        });
        countAgent({ client, isOpen: true });
      });
    },
    send,
    agentConnectionCount: () => agentClients.size,
    close: async () => {
      const clients = [...server.clients];
      for (const client of clients) {
        client.close(1001, "The engine closed.");
      }
      const deadline = Date.now() + closeWaitMilliseconds;
      while (
        clients.some((client) => client.readyState !== WebSocket.CLOSED) &&
        Date.now() < deadline
      ) {
        await delay(20);
      }
      for (const client of clients) {
        client.terminate();
      }
      server.close();
    },
  };
}
