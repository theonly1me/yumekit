import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { claudeLines, gateFileOf, setScenario } from "./chatTesting.js";
import type { RunningEngine } from "./runEngine.js";

export function readScript(engine: RunningEngine): Promise<string> {
  return readFile(join(engine.projectFolder, "script.md"), "utf8");
}

export async function openStepSheet(options: {
  page: Page;
  name: "Script" | "Pictures";
}): Promise<void> {
  await options.page
    .getByRole("button", { name: options.name, exact: true })
    .click();
  await options.page.getByRole("dialog").waitFor();
}

export async function answerAfterGate(engine: RunningEngine): Promise<void> {
  await rm(gateFileOf(engine), { force: true });
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { waitForFile: gateFileOf(engine) },
        { print: claudeLines.whole("I updated the video.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
}
