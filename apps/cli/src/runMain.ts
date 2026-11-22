import { usage } from "./commandResult.js";
import { runCommand } from "./runCommand.js";

export async function runMain(args: string[]): Promise<void> {
  const result = await runCommand(args);
  switch (result.kind) {
    case "done":
      process.stdout.write(result.output);
      break;
    case "serving":
      break;
    case "failed":
      process.stderr.write(`yumekit: ${result.message}\n`);
      process.exitCode = 1;
      break;
    case "failed-with-output":
      process.stdout.write(result.output);
      process.exitCode = 1;
      break;
    case "usage-error":
      process.stderr.write(`yumekit: ${result.message}\n\n${usage}`);
      process.exitCode = 2;
      break;
  }
}
