import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const scenarioSchema = z.object({
  signIn: z.enum(["chatgpt", "api-key", "none"]),
  hasFeature: z.boolean(),
  turn: z.enum(["picture", "no-file", "not-a-picture", "usage-limit", "hang"]),
  width: z.number(),
  height: z.number(),
  waitMilliseconds: z.number(),
});

const scenarioFile = process.env["YUMEKIT_FAKE_CODEX_SCENARIO"] ?? "";
const scenario = scenarioSchema.parse(
  JSON.parse(readFileSync(scenarioFile, "utf8")),
);
const programArguments = process.argv.slice(2);
const command = programArguments.slice(0, 2).join(" ");
const codexHome = process.env["CODEX_HOME"] ?? "";

function printLine(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function pngBytes(): Buffer {
  const header = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(scenario.width, 16);
  header.writeUInt32BE(scenario.height, 20);
  return header;
}

function makeTurn(threadId: string): void {
  const folder = join(codexHome, "generated_images", threadId);
  if (scenario.turn === "picture" || scenario.turn === "not-a-picture") {
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, `exec-${randomUUID()}.png`),
      scenario.turn === "picture" ? pngBytes() : "not a picture",
    );
  }
  if (scenario.turn === "usage-limit") {
    printLine({
      type: "turn.failed",
      error: { message: "You’ve hit your usage limit. Try again at 4:12 PM." },
    });
    process.exitCode = 1;
    return;
  }
  printLine({
    type: "item.completed",
    item: { id: "item_0", type: "agent_message", text: "I made the picture." },
  });
  printLine({ type: "turn.completed", usage: {} });
}

if (command === "login status") {
  if (scenario.signIn === "none") {
    process.stderr.write("Not logged in\n");
    process.exit(1);
  }
  process.stderr.write(
    scenario.signIn === "chatgpt"
      ? "Logged in using ChatGPT\n"
      : "Logged in using an API key - sk-proj-***\n",
  );
  process.exit(0);
}
if (command === "features list") {
  if (scenario.hasFeature) {
    process.stdout.write(
      "image_generation                         stable             true\n",
    );
  }
  process.exit(0);
}
const threadId = randomUUID();
appendFileSync(
  `${scenarioFile}.runs.jsonl`,
  `${JSON.stringify({ arguments: programArguments, folder: process.cwd(), codexHome, threadId, startedAt: Date.now() })}\n`,
);
printLine({ type: "thread.started", thread_id: threadId });
printLine({ type: "turn.started" });
if (scenario.turn === "hang") {
  setInterval(() => undefined, 1_000);
} else {
  setTimeout(() => {
    makeTurn(threadId);
  }, scenario.waitMilliseconds);
}
