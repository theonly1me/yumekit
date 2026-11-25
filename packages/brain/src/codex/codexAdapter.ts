import type { AgentAdapter, SignInState } from "../brainTypes.js";
import { readCommand } from "../program/findProgram.js";
import { runTurn } from "../program/runTurn.js";
import { codexArgumentsOf } from "./codexArguments.js";
import { createCodexStreamParser } from "./codexStream.js";

async function codexSignInState(programPath: string): Promise<SignInState> {
  const output = await readCommand({
    programPath,
    arguments: ["login", "status"],
  });
  if (output.exitCode === undefined) return "unknown";
  return output.exitCode === 0 ? "signed-in" : "signed-out";
}

export function createCodexAdapter(options: {
  programPath: string;
}): AgentAdapter {
  const { programPath } = options;
  return {
    id: "codex",
    name: "Codex",
    signInState: () => codexSignInState(programPath),
    startTurn: (turn) =>
      runTurn({
        programPath,
        arguments: codexArgumentsOf({
          request: turn.request,
          sessionId: turn.sessionId,
          instructions: turn.instructions,
          serverCommand: turn.serverCommand,
          choice: turn.choice,
        }),
        workingFolder: turn.workingFolder,
        parser: createCodexStreamParser(),
        onEvent: turn.onEvent,
      }),
  };
}
