import type { MediaToolResult } from "./convention.js";

export type Capability = "image" | "speech" | "align" | "music" | "video";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export interface ServerCommand {
  command: string;
  args: string[];
  passEnvironment?: string[];
}

export type MediaToolFailure =
  | {
      kind: "no-server-for-capability";
      capability: Capability;
      server?: string;
    }
  | { kind: "server-not-found"; server: string }
  | { kind: "server-failed-to-start"; server: string; message: string }
  | { kind: "media-tool-failed"; server: string; message: string }
  | { kind: "media-tool-invalid-result"; server: string; message: string }
  | { kind: "media-tool-timeout"; server: string; timeoutSeconds: number };

export interface ConnectFailure {
  kind: "invalid-configuration-file";
  file: string;
  message: string;
}

export interface MediaToolRequest {
  capability: Capability;
  server?: string;
  input: JsonObject;
  outputDirectory: string;
  fileStem: string;
}

export interface MediaTools {
  list: () => { server: string; capabilities: Capability[] }[];
  run: (
    request: MediaToolRequest,
  ) => Promise<
    Outcome<{ server: string; result: MediaToolResult }, MediaToolFailure>
  >;
  failedServers: () => { server: string; message: string }[];
  close: () => Promise<void>;
}
