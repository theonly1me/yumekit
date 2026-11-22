import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { RenderFailure } from "../renderFailure.js";
import { launchBrowser } from "./launchBrowser.js";

export interface ProgramCommand {
  command: string;
  args: string[];
}

export function browserInstallCommand(): ProgramCommand {
  const playwrightFolder = dirname(
    createRequire(import.meta.url).resolve("playwright-core/package.json"),
  );
  return {
    command: process.execPath,
    args: [join(playwrightFolder, "cli.js"), "install", "chromium"],
  };
}

export async function findBrowser(): Promise<RenderFailure | undefined> {
  const launched = await launchBrowser();
  if (!launched.ok) return launched.failure;
  await launched.value.close();
  return undefined;
}
