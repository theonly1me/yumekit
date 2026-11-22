import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const stepSchema = z.union([
  z.object({ print: z.string() }),
  z.object({
    callTool: z.object({
      name: z.string(),
      input: z.record(z.string(), z.unknown()),
    }),
  }),
  z.object({ waitForStop: z.object({ print: z.array(z.string()) }) }),
]);

const scenarioSchema = z.object({
  steps: z.array(stepSchema),
  exitCode: z.number(),
  signedIn: z.boolean(),
  resumeFails: z.boolean(),
});

const engineFileSchema = z.object({ port: z.number(), token: z.string() });

type Step = z.infer<typeof stepSchema>;

const scenarioFile = process.env["YUMEKIT_FAKE_AGENT_SCENARIO"] ?? "";
const scenario = scenarioSchema.parse(
  JSON.parse(readFileSync(scenarioFile, "utf8")),
);
const programArguments = process.argv.slice(2);
const command = programArguments.slice(0, 2).join(" ");

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

async function callTool(options: { name: string; input: object }) {
  const engine = engineFileSchema.parse(
    JSON.parse(readFileSync(join(process.cwd(), "..", "engine.json"), "utf8")),
  );
  await fetch(
    `http://127.0.0.1:${String(engine.port)}/api/tools/${options.name}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${engine.token}`,
        "content-type": "application/json",
        "x-yumekit-client": "agent",
      },
      body: JSON.stringify({ input: options.input }),
    },
  );
}

function waitForStop(lines: string[]): Promise<void> {
  const stopped = Promise.withResolvers<undefined>();
  const keepAlive = setInterval(() => undefined, 1_000);
  process.once("SIGINT", () => {
    clearInterval(keepAlive);
    for (const line of lines) print(line);
    stopped.resolve(undefined);
  });
  return stopped.promise;
}

async function runStep(step: Step): Promise<void> {
  if ("print" in step) print(step.print);
  else if ("callTool" in step) await callTool(step.callTool);
  else await waitForStop(step.waitForStop.print);
}

async function run(): Promise<number> {
  if (command === "auth status") {
    print(JSON.stringify({ loggedIn: scenario.signedIn }));
    return 0;
  }
  appendFileSync(
    `${scenarioFile}.runs.jsonl`,
    `${JSON.stringify(programArguments)}\n`,
  );
  if (scenario.resumeFails && programArguments.includes("--resume")) return 1;
  for (const step of scenario.steps) await runStep(step);
  return scenario.exitCode;
}

process.exitCode = await run();
