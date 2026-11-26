import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";

const callsSchema = z.array(
  z.object({ name: z.string(), input: z.record(z.string(), z.unknown()) }),
);

const scenarioSchema = z.object({
  calls: callsSchema,
  restCalls: callsSchema.default([]),
  waitFile: z.string(),
  restWaitFile: z.string(),
  ending: z.enum(["done", "failed"]),
});

const engineFileSchema = z.object({ port: z.number(), token: z.string() });

const scenario = scenarioSchema.parse(
  JSON.parse(readFileSync(process.env["YUMEKIT_FAKE_MAKING"] ?? "", "utf8")),
);
const programArguments = process.argv.slice(2);
const isContinue =
  programArguments.at(-1) ===
  "The plan is good. Use the script and the scenes as they are now, and make the rest of the video.";
const turn = isContinue
  ? { calls: scenario.restCalls, waitFile: scenario.restWaitFile }
  : { calls: scenario.calls, waitFile: scenario.waitFile };

function print(value: object): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

let isStopped = false;
process.once("SIGINT", () => {
  isStopped = true;
});

async function callTool(options: {
  callId: string;
  name: string;
  input: object;
}): Promise<void> {
  print({
    type: "assistant",
    message: {
      content: [
        {
          type: "tool_use",
          id: options.callId,
          name: `mcp__yumekit__${options.name}`,
          input: options.input,
        },
      ],
    },
  });
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
      },
      body: JSON.stringify({ input: options.input }),
    },
  );
  const result = z
    .object({ isError: z.boolean() })
    .parse(await response.json());
  print({
    type: "user",
    message: {
      content: [
        {
          type: "tool_result",
          tool_use_id: options.callId,
          is_error: result.isError,
        },
      ],
    },
  });
}

async function run(): Promise<void> {
  if (programArguments.slice(0, 2).join(" ") === "auth status") {
    print({ loggedIn: true });
    return;
  }
  print({
    type: "system",
    subtype: "init",
    session_id: "made-up-making-session",
    mcp_servers: [{ name: "yumekit", status: "connected" }],
  });
  for (const [index, call] of turn.calls.entries()) {
    await callTool({ callId: `call-${String(index)}`, ...call });
  }
  while (!isStopped && !existsSync(turn.waitFile)) await delay(100);
  if (isStopped) {
    print({
      type: "result",
      is_error: false,
      terminal_reason: "aborted_streaming",
    });
    return;
  }
  if (scenario.ending === "failed") {
    print({
      type: "result",
      is_error: true,
      terminal_reason: "error",
      result: "The model is not available.",
    });
    return;
  }
  print({
    type: "assistant",
    message: { content: [{ type: "text", text: "The video is ready." }] },
  });
  print({ type: "result", is_error: false, terminal_reason: "completed" });
}

await run();
