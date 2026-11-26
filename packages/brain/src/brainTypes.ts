export const brainAgentIds = ["claude-code", "codex", "cursor"] as const;

export type AgentId = (typeof brainAgentIds)[number];

export type SignInState = "signed-in" | "signed-out" | "unknown";

export interface ServerCommand {
  command: string;
  args: string[];
}

export type BrainEvent =
  | { type: "session"; sessionId: string; model?: string }
  | { type: "text"; text: string; isPart: boolean }
  | { type: "tool-started"; callId: string; tool: string; input: unknown }
  | { type: "tool-finished"; callId: string; ok: boolean };

export type TurnFailureReason = "signed-out" | "program" | "tools";

export type TurnEnd =
  | { kind: "done"; costUsd?: number }
  | { kind: "stopped" }
  | { kind: "failed"; reason: TurnFailureReason; message: string };

export interface ModelChoice {
  model?: string | undefined;
  effort?: string | undefined;
}

export interface ReadOnlyPaths {
  files: string[];
  folders: string[];
}

export type RunAccess =
  | { kind: "yumekit-only" }
  | {
      kind: "program";
      readFolders: string[];
      closedFolders: string[];
      readOnly: ReadOnlyPaths;
      allowedRules: string[];
    };

export interface TurnOptions {
  request: string;
  choice?: ModelChoice | undefined;
  access?: RunAccess | undefined;
  sessionId: string | undefined;
  instructions: string;
  serverCommand: ServerCommand;
  workingFolder: string;
  onEvent: (event: BrainEvent) => void;
}

export interface Turn {
  ended: Promise<TurnEnd>;
  stop: () => void;
}

export interface AgentAdapter {
  id: AgentId;
  name: string;
  signInState: () => Promise<SignInState>;
  startTurn: (options: TurnOptions) => Turn;
}

export interface StreamStep {
  events: BrainEvent[];
  end?: TurnEnd;
  stopProgram?: true;
}

export interface StreamParser {
  readLine: (line: string) => StreamStep;
  endOf: (exit: {
    stopRequested: boolean;
    lastErrorLine: string | undefined;
  }) => TurnEnd;
}

export const serverName = "yumekit";
