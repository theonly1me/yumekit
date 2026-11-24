import { execFile } from "node:child_process";
import { access, constants, stat } from "node:fs/promises";
import { delimiter, isAbsolute, join } from "node:path";
import type { Outcome } from "./toolResults.ts";

const checkWaitMilliseconds = 15_000;
const featureName = "image_generation";

export const installStep =
  "Install Codex from https://developers.openai.com/codex/cli, then sign in with your ChatGPT account.";
export const signInStep =
  'Open a terminal and run: codex login. Pick "Sign in with ChatGPT".';

async function isProgram(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

export async function findCodex(
  environment: Record<string, string | undefined>,
): Promise<string | undefined> {
  const chosen = environment["YUMEKIT_CODEX_PATH"];
  if (chosen !== undefined && chosen !== "") {
    return (await isProgram(chosen)) ? chosen : undefined;
  }
  const folders = (environment["PATH"] ?? "")
    .split(delimiter)
    .filter((folder) => isAbsolute(folder));
  for (const folder of folders) {
    const file = join(folder, "codex");
    if (await isProgram(file)) return file;
  }
  return undefined;
}

interface CommandOutput {
  exitCode: number | undefined;
  text: string;
}

function readCommand(options: {
  programPath: string;
  arguments: string[];
  environment: NodeJS.ProcessEnv;
}): Promise<CommandOutput> {
  const finished = Promise.withResolvers<CommandOutput>();
  execFile(
    options.programPath,
    options.arguments,
    {
      timeout: checkWaitMilliseconds,
      shell: false,
      env: options.environment,
    },
    (...results) => {
      const [error, stdout, stderr] = results;
      const text = `${stdout}\n${stderr}`;
      if (error === null) {
        finished.resolve({ exitCode: 0, text });
        return;
      }
      finished.resolve({
        exitCode: typeof error.code === "number" ? error.code : undefined,
        text,
      });
    },
  );
  return finished.promise;
}

function featureIsThere(featureList: string): boolean {
  return featureList
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .some(
      ([name, ...rest]) => name === featureName && !rest.includes("removed"),
    );
}

export async function checkCodex(options: {
  programPath: string | undefined;
  environment: NodeJS.ProcessEnv;
}): Promise<Outcome<string, string>> {
  const { programPath, environment } = options;
  if (programPath === undefined) {
    return {
      ok: false,
      failure: `yumekit did not find the Codex program on this computer. ${installStep}`,
    };
  }
  const signIn = await readCommand({
    programPath,
    arguments: ["login", "status"],
    environment,
  });
  if (signIn.exitCode !== 0) {
    return { ok: false, failure: `Codex is not signed in. ${signInStep}` };
  }
  if (!/ChatGPT/i.test(signIn.text)) {
    return {
      ok: false,
      failure: `Codex is signed in with an API key, not a ChatGPT account. Pictures through Codex use only a ChatGPT plan, so yumekit never spends money on that key. ${signInStep}`,
    };
  }
  const features = await readCommand({
    programPath,
    arguments: ["features", "list"],
    environment,
  });
  if (!featureIsThere(features.text)) {
    return {
      ok: false,
      failure:
        "This Codex version cannot make pictures. Open a terminal and run: codex update.",
    };
  }
  return { ok: true, value: programPath };
}
