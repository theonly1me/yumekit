import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";

const scenarioSchema = z.object({
  lines: z.array(z.string()),
  exitCode: z.number(),
  untilInterrupt: z
    .object({ lines: z.array(z.string()), exitCode: z.number() })
    .optional(),
  ignoresInterrupt: z.boolean().optional(),
  signedIn: z.boolean(),
});

const scenarioFile = process.env["YUMEKIT_FAKE_SCENARIO"] ?? "";
const scenario = scenarioSchema.parse(
  JSON.parse(readFileSync(scenarioFile, "utf8")),
);
const programArguments = process.argv.slice(2);
const command = programArguments.slice(0, 2).join(" ");

function printLines(lines: string[]): void {
  for (const line of lines) process.stdout.write(`${line}\n`);
}

if (command === "auth status") {
  printLines([JSON.stringify({ loggedIn: scenario.signedIn })]);
  process.exit(0);
}
if (command === "login status") {
  process.exit(scenario.signedIn ? 0 : 1);
}
writeFileSync(
  `${scenarioFile}.arguments.json`,
  JSON.stringify({ arguments: programArguments, folder: process.cwd() }),
);
const { untilInterrupt } = scenario;
if (untilInterrupt === undefined) {
  process.exitCode = scenario.exitCode;
} else {
  const keepAlive = setInterval(() => undefined, 1_000);
  process.on("SIGINT", () => {
    if (scenario.ignoresInterrupt === true) return;
    clearInterval(keepAlive);
    printLines(untilInterrupt.lines);
    process.exitCode = untilInterrupt.exitCode;
  });
}
printLines(scenario.lines);
