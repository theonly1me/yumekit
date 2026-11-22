#!/usr/bin/env node
import { nodeVersionProblemOf } from "./nodeVersion.js";

const nodeVersionProblem = nodeVersionProblemOf(process.versions.node);
if (nodeVersionProblem === undefined) {
  const { runMain } = await import("./runMain.js");
  await runMain(process.argv.slice(2));
} else {
  process.stderr.write(`yumekit: ${nodeVersionProblem}\n`);
  process.exitCode = 1;
}
