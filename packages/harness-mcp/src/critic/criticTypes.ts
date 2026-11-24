export interface CriticRequest {
  brief: string;
  subject: string;
}

export type CriticTurn =
  | { ok: true; seconds: number; costUsd?: number }
  | { ok: false; failure: { kind: string; message: string; hint: string } };

export type AskCritic = (request: CriticRequest) => Promise<CriticTurn>;

export const criticToolNames = [
  "view_for_review",
  "give_clip_review",
  "give_sheet_review",
  "give_plan_review",
  "give_start_review",
] as const;

export function isCriticTool(tool: string): boolean {
  return criticToolNames.some((name) => name === tool);
}

export const noCriticFailure = {
  kind: "no-critic",
  message:
    "No critic can look at this work. A review needs the agent program of the person, through the editor.",
  hint: "Open the project in the editor with Claude Code, Codex, or Cursor signed in, and ask again. A plan, a sheet, or a clip with no review cannot be used.",
};
