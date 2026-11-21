export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export interface Engine {
  url: string;
  token: string;
  close: () => Promise<void>;
}

export type EngineFailure =
  | { kind: "project-invalid"; message: string }
  | { kind: "engine-already-running"; url: string }
  | { kind: "port-not-free"; port: number };

export type EngineEvent =
  | { type: "project-changed"; revision: number }
  | {
      type: "call-progress";
      callId: string;
      done: number;
      total?: number;
      message?: string;
    }
  | { type: "media-servers-changed" }
  | { type: "agents-changed"; connected: number }
  | { type: "engine-closing" };
