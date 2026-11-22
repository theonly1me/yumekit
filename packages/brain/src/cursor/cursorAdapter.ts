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
import { cursorArgumentsOf } from "./cursorArguments.js";
import { cursorFoldersOf, writeCursorFiles } from "./cursorFiles.js";
import { createCursorStreamParser } from "./cursorStream.js";

const statusSchema = z.looseObject({ isAuthenticated: z.boolean() });

export const cursorConfigurationVariable = "CURSOR_CONFIG_DIR";

async function cursorSignInState(programPath: string): Promise<SignInState> {
  const output = await readCommand({
    programPath,
    arguments: ["status", "--format", "json"],
  });
  const status = statusSchema.safeParse(jsonLineOf(output.stdout));
  if (!status.success) return "unknown";
  return status.data.isAuthenticated ? "signed-in" : "signed-out";
}

function startCursorTurn(options: {
  programPath: string;
  turn: TurnOptions;
}): Turn {
  const { turn } = options;
  const folders = cursorFoldersOf(turn.workingFolder);
  return startPreparedTurn({
    preparationFailure: "yumekit could not write the files for Cursor.",
    prepare: async () => {
      await writeCursorFiles({
        folders,
        instructions: turn.instructions,
        serverCommand: turn.serverCommand,
      });
      return {
        run: {
          programPath: options.programPath,
          arguments: cursorArgumentsOf({
            request: turn.request,
            sessionId: turn.sessionId,
            agentFolder: folders.agentFolder,
          }),
          workingFolder: folders.agentFolder,
          environment: {
            [cursorConfigurationVariable]: folders.configurationFolder,
          },
          parser: createCursorStreamParser(),
          onEvent: turn.onEvent,
        },
        cleanUp: () => Promise.resolve(),
      };
    },
  });
}

export function createCursorAdapter(options: {
  programPath: string;
}): AgentAdapter {
  const { programPath } = options;
  return {
    id: "cursor",
    name: "Cursor",
    signInState: () => cursorSignInState(programPath),
    startTurn: (turn) => startCursorTurn({ programPath, turn }),
  };
}
