import { createInterface } from "node:readline";
import { startProgram, stopProgram } from "./processes.ts";

export interface McpSession {
  request: (options: { method: string; params: unknown }) => Promise<unknown>;
  close: () => Promise<void>;
}

interface Waiter {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function startMcpSession(options: {
  command: string;
  args: string[];
  cwd: string;
  environment: NodeJS.ProcessEnv;
}): Promise<McpSession> {
  const child = startProgram(options);
  const waiters = new Map<number, Waiter>();
  const stderr: string[] = [];
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString()));
  child.on("close", () => {
    for (const waiter of waiters.values()) {
      waiter.reject(new Error(`yumekit mcp stopped:\n${stderr.join("")}`));
    }
  });
  createInterface({ input: child.stdout }).on("line", (line) => {
    const message: unknown = JSON.parse(line);
    if (!isRecord(message) || typeof message["id"] !== "number") return;
    const waiter = waiters.get(message["id"]);
    waiters.delete(message["id"]);
    if (message["error"] !== undefined) {
      waiter?.reject(new Error(JSON.stringify(message["error"])));
    } else {
      waiter?.resolve(message["result"]);
    }
  });
  let nextId = 1;
  const send = (message: unknown) => {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  };
  const request = (call: { method: string; params: unknown }) => {
    const id = nextId;
    nextId += 1;
    const answered = Promise.withResolvers<unknown>();
    waiters.set(id, answered);
    send({ jsonrpc: "2.0", id, method: call.method, params: call.params });
    return answered.promise;
  };
  await request({
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "install-check", version: "1.0.0" },
    },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  return { request, close: () => stopProgram(child) };
}

export async function callTool(options: {
  session: McpSession;
  name: string;
  input: Record<string, unknown>;
}): Promise<string> {
  const result = await options.session.request({
    method: "tools/call",
    params: { name: options.name, arguments: options.input },
  });
  const text = JSON.stringify(result);
  if (isRecord(result) && result["isError"] === true) {
    throw new Error(`${options.name} failed: ${text}`);
  }
  return text;
}
