import type { MediaServerKey } from "./description.js";
import type { KeyState } from "./keys/index.js";

export type ChoiceCapability = "image" | "speech" | "music" | "video";

export interface MediaPick {
  capability: ChoiceCapability;
  server?: string;
  model?: string;
}

export type MediaPickFailure =
  | { kind: "server-not-found"; server: string }
  | {
      kind: "no-server-for-capability";
      capability: ChoiceCapability;
      server: string;
    }
  | { kind: "model-not-found"; server: string; model: string; message: string }
  | { kind: "invalid-configuration-file"; file: string; message: string }
  | { kind: "configuration-not-written"; file: string; message: string };

export type UserFileFailure = Extract<
  MediaPickFailure,
  { kind: "invalid-configuration-file" | "configuration-not-written" }
>;

export type ServiceState = "ready" | "needs-key";

export interface ChoiceModel {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface ChoiceService {
  server: string;
  label: string;
  state: ServiceState;
  keys: (MediaServerKey & { source: KeyState["source"] })[];
  models: ChoiceModel[];
}

export interface CurrentPick {
  server: string;
  serverLabel: string;
  model?: string;
  modelLabel?: string;
  source: "picked" | "first-ready";
  state: ServiceState | "not-available";
}

export interface MediaChoice {
  capability: ChoiceCapability;
  current?: CurrentPick;
  services: ChoiceService[];
}

export interface MediaChoices {
  choices: MediaChoice[];
  failedServers: { server: string; message: string }[];
}
