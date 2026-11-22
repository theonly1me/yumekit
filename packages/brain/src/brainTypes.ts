export const brainAgentIds = ["claude-code", "codex"] as const;

export type AgentId = (typeof brainAgentIds)[number];

export type SignInState = "signed-in" | "signed-out" | "unknown";

export interface ServerCommand {
  command: string;
  args: string[];
}

export type BrainEvent =
  | { type: "session"; sessionId: string }
  | { type: "text"; text: string; isPart: boolean }
  | { type: "tool-started"; callId: string; tool: string; input: unknown }
  | { type: "tool-finished"; callId: string; ok: boolean };

export type TurnFailureReason = "signed-out" | "program" | "tools";

export type TurnEnd =
  | { kind: "done"; costUsd?: number }
  | { kind: "stopped" }
  | { kind: "failed"; reason: TurnFailureReason; message: string };

export interface TurnOptions {
  request: string;
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
  endOf: (exit: { stopRequested: boolean }) => TurnEnd;
}

export const serverName = "yumekit";
