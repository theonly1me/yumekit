import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Page } from "playwright";
import { z } from "zod";
import {
  claudeLines,
  writeFakeScenario,
  type FakeAgentScenario,
} from "./fakeAgent.js";
import type { RunningEngine } from "./runEngine.js";

export { claudeLines };

function scenarioFileOf(engine: RunningEngine): string {
  const file = engine.environment["YUMEKIT_FAKE_AGENT_SCENARIO"];
  if (file === undefined) throw new Error("The engine has no fake agent.");
  return file;
}

export function setScenario(options: {
  engine: RunningEngine;
  scenario: FakeAgentScenario;
}): Promise<void> {
  return writeFakeScenario({
    scenarioFile: scenarioFileOf(options.engine),
    scenario: options.scenario,
  });
}

export function gateFileOf(engine: RunningEngine): string {
  return `${scenarioFileOf(engine)}.gate`;
}

export function openGate(engine: RunningEngine): Promise<void> {
  return writeFile(gateFileOf(engine), "open");
}

export async function writeSettings(options: {
  engine: RunningEngine;
  settings: object | string;
}): Promise<void> {
  const folder = options.engine.environment["YUMEKIT_CONFIG_DIRECTORY"] ?? "";
  await writeFile(
    join(folder, "settings.json"),
    typeof options.settings === "string"
      ? options.settings
      : JSON.stringify(options.settings),
  );
}

export function writeFakeAgentSettings(engine: RunningEngine): Promise<void> {
  const programPath = join(dirname(scenarioFileOf(engine)), "claude");
  return writeSettings({
    engine,
    settings: {
      agent: "claude-code",
      agentPrograms: { "claude-code": programPath },
    },
  });
}

export async function readSettings(engine: RunningEngine): Promise<unknown> {
  const folder = engine.environment["YUMEKIT_CONFIG_DIRECTORY"] ?? "";
  return JSON.parse(await readFile(join(folder, "settings.json"), "utf8"));
}

export async function requestTextsSent(
  engine: RunningEngine,
): Promise<string[]> {
  const text = await readFile(
    `${scenarioFileOf(engine)}.runs.jsonl`,
    "utf8",
  ).catch(() => "");
  return text
    .trim()
    .split("\n")
    .filter((runLine) => runLine !== "")
    .map((runLine) => {
      const programArguments = z.array(z.string()).parse(JSON.parse(runLine));
      return programArguments.at(-1) ?? "";
    });
}

export function chatOf(page: Page) {
  const history = page.getByRole("list", { name: "Chat with the AI" });
  const box = page.getByRole("textbox", { name: "Ask for a change" });
  return {
    history,
    box,
    entryTexts: async (count: number) =>
      (await history.locator(":scope > li").allInnerTexts())
        .map((text) => text.replace(/\n+/g, "\n").trim())
        .slice(-count),
    ask: async (text: string) => {
      await box.fill(text);
      await box.press("Enter");
    },
    sendButton: page.getByRole("button", { name: "Send", exact: true }),
    stopButton: page.getByRole("button", { name: "Stop", exact: true }),
  };
}
