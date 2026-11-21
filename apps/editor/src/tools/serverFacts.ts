import type { Capability, MediaServer, MediaServers } from "./mediaServers.js";

export type KeyStateKind = "missing" | "key-file" | "environment" | "no-key";

export type ServerRow =
  | {
      kind: "started";
      id: string;
      label: string;
      makes: string;
      runs: string | undefined;
      keyState: KeyStateKind;
      server: MediaServer;
    }
  | { kind: "failed"; id: string; label: string; message: string };

const capabilityWords: Record<Capability, string> = {
  image: "images",
  speech: "voice",
  align: "word timings",
  music: "music",
  video: "video",
};

function sentenceCase(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function makesText(capabilities: Capability[]): string {
  return sentenceCase(
    capabilities.map((capability) => capabilityWords[capability]).join(", "),
  );
}

export function keyStateOf(server: MediaServer): KeyStateKind {
  const { keys } = server;
  if (keys.length === 0) return "no-key";
  if (keys.some((key) => key.source === "missing")) return "missing";
  return keys.every((key) => key.source === "environment")
    ? "environment"
    : "key-file";
}

export function isServerReady(server: MediaServer): boolean {
  return keyStateOf(server) !== "missing";
}

export function labelOf(server: MediaServer): string {
  return server.label ?? server.server;
}

const runsText = {
  hosted: "Hosted",
  "on-this-computer": "On this computer",
} as const;

const stateTexts: Record<KeyStateKind, string> = {
  missing: "Needs a key",
  "key-file": "Ready, key saved here",
  environment: "Ready, key from your shell",
  "no-key": "Ready, no key needed",
};

export function stateTextOf(row: ServerRow): string {
  return row.kind === "failed" ? "Failed to start" : stateTexts[row.keyState];
}

export function serverRowsOf(servers: MediaServers): ServerRow[] {
  const started = servers.servers.map((server): ServerRow => ({
    kind: "started",
    id: server.server,
    label: labelOf(server),
    makes: makesText(server.capabilities),
    runs: server.runs === undefined ? undefined : runsText[server.runs],
    keyState: keyStateOf(server),
    server,
  }));
  const failed = servers.failed_servers.map((server): ServerRow => ({
    kind: "failed",
    id: server.server,
    label: server.server,
    message: server.message,
  }));
  return [...started, ...failed];
}
