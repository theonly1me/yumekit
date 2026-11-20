#!/usr/bin/env node
import { usage } from "./commandResult.js";
import { runCommand } from "./runCommand.js";

const result = await runCommand(process.argv.slice(2));
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
  case "usage-error":
    process.stderr.write(`yumekit: ${result.message}\n\n${usage}`);
    process.exitCode = 2;
    break;
}
