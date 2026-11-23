import type { MediaToolResult } from "./convention.js";
import type {
  MediaChoices,
  MediaPick,
  MediaPickFailure,
  UserFileFailure,
} from "./choiceTypes.js";
import type { MediaModel, MediaServerDescription } from "./description.js";

export type Capability =
  "image" | "speech" | "align" | "music" | "video" | "sound-effect" | "sharper";

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
  | { kind: "media-tool-timeout"; server: string; timeoutSeconds: number }
  | {
      kind: "media-key-missing";
      server: string;
      variable: string;
      getKeyUrl: string;
      steps: string[];
    };

export type CheckKeyFailure =
  | Exclude<
      MediaToolFailure,
      { kind: "no-server-for-capability" | "media-key-missing" }
    >
  | { kind: "no-check-key-tool"; server: string };

export interface KeyCheck {
  valid: boolean;
  message: string;
}

export interface ConnectFailure {
  kind: "invalid-configuration-file";
  file: string;
  message: string;
}

export interface MediaToolProgress {
  done: number;
  total?: number;
  message?: string;
}

export interface MediaToolRequest {
  capability: Capability;
  server?: string;
  model?: string;
  input: JsonObject;
  outputDirectory: string;
  fileStem: string;
  onProgress?: (progress: MediaToolProgress) => void;
}

export type MediaModelChoice = Pick<
  MediaToolRequest,
  "capability" | "server" | "model"
>;

export interface MediaLimits {
  generatedVideoSeconds: number;
}

export interface MediaServerEntry {
  server: string;
  capabilities: Capability[];
  canCheckKey: boolean;
  description?: MediaServerDescription;
  descriptionFailure?: { kind: "media-tool-invalid-result"; message: string };
}

export interface MediaToolRun {
  server: string;
  model?: string;
  result: MediaToolResult;
}

export interface MediaTools {
  list: () => MediaServerEntry[];
  run: (
    request: MediaToolRequest,
  ) => Promise<Outcome<MediaToolRun, MediaToolFailure>>;
  chosenModel: (choice: MediaModelChoice) => Promise<MediaModel | undefined>;
  checkKey: (server: string) => Promise<Outcome<KeyCheck, CheckKeyFailure>>;
  failedServers: () => { server: string; message: string }[];
  limits: () => MediaLimits;
  setVideoLimit: (
    seconds: number,
  ) => Promise<Outcome<MediaLimits, UserFileFailure>>;
  choices: () => Promise<MediaChoices>;
  pick: (pick: MediaPick) => Promise<Outcome<MediaChoices, MediaPickFailure>>;
  close: () => Promise<void>;
}
