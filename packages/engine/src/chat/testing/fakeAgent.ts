import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const stepSchema = z.union([
  z.object({ print: z.string() }),
  z.object({
    callTool: z.object({
      name: z.string(),
      input: z.record(z.string(), z.unknown()),
      saveResultTo: z.string().optional(),
    }),
  }),
  z.object({ waitForStop: z.object({ print: z.array(z.string()) }) }),
  z.object({ waitForFile: z.string() }),
  z.object({ followRequest: z.literal(true) }),
]);

const scenarioSchema = z.object({
  steps: z.array(stepSchema),
  helperSteps: z.array(stepSchema).default([]),
  criticSteps: z.array(stepSchema).default([]),
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
const helperToken = /"--helper","([^"]+)"/.exec(
  programArguments.join(" "),
)?.[1];

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

async function callTool(options: {
  name: string;
  input: object;
  saveResultTo?: string | undefined;
}) {
  const inProjectFolder = join(process.cwd(), ".yumekit", "engine.json");
  const engine = engineFileSchema.parse(
    JSON.parse(
      readFileSync(
        existsSync(inProjectFolder)
          ? inProjectFolder
          : join(process.cwd(), "..", "engine.json"),
        "utf8",
      ),
    ),
  );
  const response = await fetch(
    `http://127.0.0.1:${String(engine.port)}/api/tools/${options.name}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${engine.token}`,
        "content-type": "application/json",
        "x-yumekit-client": "agent",
        ...(helperToken === undefined
          ? {}
          : { "x-yumekit-helper": helperToken }),
      },
      body: JSON.stringify({ input: options.input }),
    },
  );
  const body = await response.text();
  if (options.saveResultTo !== undefined) {
    writeFileSync(options.saveResultTo, body);
  }
  return body;
}

const exactStepPattern = /^\d+\. ([a-z_]+) (\{.*\})$/gm;

function claudeLine(options: { type: string; content: object }): string {
  return JSON.stringify({
    type: options.type,
    message: { content: [options.content] },
  });
}

async function followRequest(): Promise<void> {
  const request = programArguments.at(-1) ?? "";
  for (const [index, match] of [
    ...request.matchAll(exactStepPattern),
  ].entries()) {
    const [, tool = "", inputText = "{}"] = match;
    const callId = `follow-${String(index + 1)}`;
    print(
      claudeLine({
        type: "assistant",
        content: {
          type: "tool_use",
          id: callId,
          name: `mcp__yumekit__${tool}`,
          input: {},
        },
      }),
    );
    const body = await callTool({
      name: tool,
      input: z.record(z.string(), z.unknown()).parse(JSON.parse(inputText)),
    });
    const isError = z
      .object({ isError: z.boolean() })
      .safeParse(JSON.parse(body));
    print(
      claudeLine({
        type: "user",
        content: {
          type: "tool_result",
          tool_use_id: callId,
          is_error: !isError.success || isError.data.isError,
        },
      }),
    );
  }
}

const stopSignal = Promise.withResolvers<undefined>();
process.once("SIGINT", () => {
  stopSignal.resolve(undefined);
});

async function waitForStop(lines: string[]): Promise<void> {
  const keepAlive = setInterval(() => undefined, 1_000);
  await stopSignal.promise;
  clearInterval(keepAlive);
  for (const line of lines) print(line);
}

async function waitForFile(file: string): Promise<void> {
  while (!existsSync(file)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function runStep(step: Step): Promise<void> {
  if ("print" in step) print(step.print);
  else if ("callTool" in step) await callTool(step.callTool);
  else if ("waitForFile" in step) await waitForFile(step.waitForFile);
  else if ("followRequest" in step) await followRequest();
  else await waitForStop(step.waitForStop.print);
}

async function run(): Promise<number> {
  if (command === "auth status") {
    print(JSON.stringify({ loggedIn: scenario.signedIn }));
    return 0;
  }
  if (command === "status --format") {
    print(JSON.stringify({ isAuthenticated: scenario.signedIn }));
    return 0;
  }
  appendFileSync(
    `${scenarioFile}.runs.jsonl`,
    `${JSON.stringify(programArguments)}\n`,
  );
  if (scenario.resumeFails && programArguments.includes("--resume")) return 1;
  const isCritic = (programArguments.at(-1) ?? "").startsWith("Review job");
  const steps =
    helperToken === undefined
      ? scenario.steps
      : isCritic
        ? scenario.criticSteps
        : scenario.helperSteps;
  for (const step of steps) await runStep(step);
  return scenario.exitCode;
}

process.exitCode = await run();
