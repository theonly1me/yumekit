import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type {
  AgentAdapter,
  SignInState,
  Turn,
  TurnOptions,
} from "../brainTypes.js";
import { readCommand } from "../program/findProgram.js";
import { jsonLineOf } from "../program/jsonLine.js";
import { startPreparedTurn } from "../program/preparedTurn.js";
import { claudeArgumentsOf } from "./claudeArguments.js";
import { createClaudeStreamParser } from "./claudeStream.js";

const authStatusSchema = z.looseObject({ loggedIn: z.boolean() });

async function claudeSignInState(programPath: string): Promise<SignInState> {
  const output = await readCommand({
    programPath,
    arguments: ["auth", "status"],
  });
  const status = authStatusSchema.safeParse(jsonLineOf(output.stdout));
  if (!status.success) return "unknown";
  return status.data.loggedIn ? "signed-in" : "signed-out";
}

function startClaudeTurn(options: {
  programPath: string;
  turn: TurnOptions;
}): Turn {
  const { turn } = options;
  return startPreparedTurn({
    preparationFailure:
      "yumekit could not write the instructions for Claude Code.",
    prepare: async () => {
      const folder = await mkdtemp(join(tmpdir(), "yumekit-brain-"));
      const instructionsFile = join(folder, "instructions.md");
      await writeFile(instructionsFile, turn.instructions);
      return {
        run: {
          programPath: options.programPath,
          arguments: claudeArgumentsOf({
            request: turn.request,
            sessionId: turn.sessionId,
            instructionsFile,
            serverCommand: turn.serverCommand,
          }),
          workingFolder: turn.workingFolder,
          parser: createClaudeStreamParser(),
          onEvent: turn.onEvent,
        },
        cleanUp: () => rm(folder, { recursive: true, force: true }),
      };
    },
  });
}

export function createClaudeCodeAdapter(options: {
  programPath: string;
}): AgentAdapter {
  const { programPath } = options;
  return {
    id: "claude-code",
    name: "Claude Code",
    signInState: () => claudeSignInState(programPath),
    startTurn: (turn) => startClaudeTurn({ programPath, turn }),
  };
}
