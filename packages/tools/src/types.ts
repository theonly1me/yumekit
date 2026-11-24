import type { MediaToolResult } from "./convention.js";
import type {
  MediaChoices,
  MediaPick,
  MediaPickFailure,
  UserFileFailure,
} from "./choiceTypes.js";
import type { MediaModel, MediaServerDescription } from "./description.js";
import type { PrepareFailure } from "./modelDownloads.js";
import type { CostBasis, SpendingRecordNotValid } from "./spending/ledger.js";
import type {
  SpendingLimitReached,
  SpendingSummary,
} from "./spending/spendingBook.js";

export type Capability =
  | "image"
  | "speech"
  | "align"
  | "music"
  | "video"
  | "sound-effect"
  | "talking-clip"
  | "sharper";

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
    }
  | {
      kind: "media-key-not-working";
      server: string;
      message: string;
      getKeyUrl: string;
      steps: string[];
    }
  | { kind: "media-service-not-ready"; server: string; message: string }
  | { kind: "media-usage-limit-reached"; server: string; message: string }
  | SpendingLimitReached
  | SpendingRecordNotValid;

export type CheckKeyFailure =
  | Exclude<
      MediaToolFailure,
      {
        kind:
          | "no-server-for-capability"
          | "media-key-missing"
          | "media-key-not-working"
          | "media-service-not-ready"
          | "media-usage-limit-reached"
          | "spending-limit-reached"
          | "spending-record-not-valid";
      }
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
  expectedSeconds?: number;
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
  spendingUsd: number;
}

export interface MediaServerEntry {
  server: string;
  capabilities: Capability[];
  canCheckKey: boolean;
  keyProblem?: string;
  description?: MediaServerDescription;
  descriptionFailure?: { kind: "media-tool-invalid-result"; message: string };
}

export interface MediaToolRun {
  server: string;
  model?: string;
  result: MediaToolResult;
  cost?: { usd: number; basis: CostBasis };
}

export interface MediaTools {
  list: () => MediaServerEntry[];
  run: (
    request: MediaToolRequest,
  ) => Promise<Outcome<MediaToolRun, MediaToolFailure>>;
  chosenModel: (choice: MediaModelChoice) => Promise<MediaModel | undefined>;
  checkKey: (server: string) => Promise<Outcome<KeyCheck, CheckKeyFailure>>;
  checkKeys: () => Promise<void>;
  spending: () => Promise<Outcome<SpendingSummary, SpendingRecordNotValid>>;
  failedServers: () => { server: string; message: string }[];
  limits: () => MediaLimits;
  setLimits: (
    change: Partial<MediaLimits>,
  ) => Promise<Outcome<MediaLimits, UserFileFailure>>;
  choices: () => Promise<MediaChoices>;
  pick: (pick: MediaPick) => Promise<Outcome<MediaChoices, MediaPickFailure>>;
  prepare: (request: {
    server: string;
    model?: string;
    onProgress?: (progress: MediaToolProgress) => void;
  }) => Promise<Outcome<true, PrepareFailure>>;
  onDescriptionsChanged: (listener: () => void) => () => void;
  close: () => Promise<void>;
}
