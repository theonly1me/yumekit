import { spawn } from "node:child_process";
import { browserInstallCommand } from "@yumekit/render";
import { failed, usageError, type CommandResult } from "../commandResult.js";

export function setupCommand(args: string[]): Promise<CommandResult> {
  if (args.length > 0) {
    return Promise.resolve(usageError("setup takes no arguments."));
  }
  const install = browserInstallCommand();
  const child = spawn(install.command, install.args, { stdio: "inherit" });
  return new Promise((resolve) => {
    child.on("error", (error) => {
      resolve(failed(`The browser install did not start: ${error.message}`));
    });
    child.on("close", (exitCode) => {
      resolve(
        exitCode === 0
          ? { kind: "done", output: "Chromium for Playwright is ready.\n" }
          : failed(
              `The browser install stopped with exit code ${String(exitCode)}.`,
            ),
      );
    });
  });
}
