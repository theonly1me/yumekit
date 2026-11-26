import { spawn } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import {
  cliMainFile,
  runEngine,
  type RunningEngine,
} from "../../testing/runEngine.js";
import { openMoreSettings } from "../../testing/mediaTestTools.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ agentPrograms: ["claude"] });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function startBridge() {
  const { projectFolder, environment } = runningEngine();
  const child = spawn(
    process.execPath,
    [cliMainFile, "mcp", "--project", projectFolder],
    { env: environment, stdio: ["pipe", "ignore", "ignore"] },
  );
  const exited = new Promise<void>((resolve) => {
    child.on("exit", () => {
      resolve();
    });
  });
  return {
    stop: async () => {
      child.kill("SIGTERM");
      await exited;
    },
  };
}

async function openSettings() {
  const editor = await openEditor(runningEngine().url);
  await editor.page.getByRole("button", { name: "Settings" }).click();
  await openMoreSettings(editor.page);
  return editor;
}

describe("the agent setup in Settings", () => {
  it("puts the agent that it finds first, and a connect shows where the entry is and how to start the agent", async () => {
    const editor = await openSettings();
    const folder = await realpath(runningEngine().projectFolder);
    const rows = editor.page.getByRole("list", { name: "Agents" });
    await expect
      .poll(() => rows.getByRole("listitem").allTextContents())
      .toEqual([
        "Claude CodeFound on this computerConnect",
        "CodexNot found on this computerConnect",
        "CursorNot found on this computerConnect",
      ]);
    expect(
      await editor.page.getByText("No agent is connected yet.").count(),
    ).toBe(1);

    await editor.page
      .getByRole("button", { name: "Connect Claude Code" })
      .click();
    const claudeRow = rows
      .getByRole("listitem")
      .filter({ hasText: "Claude Code" });
    await expect
      .poll(() => claudeRow.textContent())
      .toContain(`The entry is in ${join(folder, ".mcp.json")}.`);
    expect(await claudeRow.locator("pre").textContent()).toBe(
      `cd ${folder} && claude`,
    );
    expect(await claudeRow.textContent()).toContain(
      "Claude Code asks you once to approve the yumekit server.",
    );
    const written: unknown = JSON.parse(
      await readFile(join(folder, ".mcp.json"), "utf8"),
    );
    expect(written).toMatchObject({
      mcpServers: {
        yumekit: {
          command: process.execPath,
          args: [await realpath(cliMainFile), "mcp", "--project", folder],
        },
      },
    });
    await editor.close();
  });

  it("shows the failure for a file that is not valid, and keeps the file", async () => {
    const editor = await openSettings();
    const folder = await realpath(runningEngine().projectFolder);
    await mkdir(join(folder, ".cursor"), { recursive: true });
    await writeFile(join(folder, ".cursor", "mcp.json"), "{ not json");
    await editor.page.getByRole("button", { name: "Connect Cursor" }).click();
    const alert = editor.page
      .getByRole("listitem")
      .filter({ hasText: "Cursor" })
      .getByRole("alert");
    await expect
      .poll(() => alert.textContent())
      .toContain(
        `yumekit changed nothing in ${join(folder, ".cursor", "mcp.json")}.`,
      );
    expect(await readFile(join(folder, ".cursor", "mcp.json"), "utf8")).toBe(
      "{ not json",
    );
    await editor.close();
  });

  it("follows the count of agent connections with no reload", async () => {
    const editor = await openSettings();
    const state = editor.page
      .getByRole("status")
      .filter({ hasText: /connected/ });
    await expect
      .poll(() => state.textContent())
      .toBe("No agent is connected yet.");
    const bridge = startBridge();
    await expect.poll(() => state.textContent()).toBe("An agent is connected.");
    await bridge.stop();
    await expect
      .poll(() => state.textContent())
      .toBe("No agent is connected yet.");
    await editor.close();
  });

  it("gives the prompt and the manual setup with the full paths of this computer", async () => {
    const editor = await openSettings();
    const folder = await realpath(runningEngine().projectFolder);
    const main = await realpath(cliMainFile);
    const prompt = editor.page
      .locator(".group")
      .filter({ hasText: "Or give this to an agent that already runs" })
      .locator("pre");
    await expect
      .poll(() => prompt.textContent())
      .toContain(
        `${process.execPath} ${main} agent connect --agent <agent> --project ${folder}`,
      );
    await editor.page.getByRole("button", { name: "Set up by hand" }).click();
    const blocks = editor.page
      .locator(".group")
      .filter({ hasText: "Set up by hand" })
      .locator("pre");
    expect(await blocks.first().textContent()).toBe(
      `${process.execPath} ${main} mcp --project ${folder}`,
    );
    await editor.page
      .getByRole("button", { name: "Codex", exact: true })
      .click();
    expect(await blocks.last().textContent()).toContain(
      `command = ${JSON.stringify(process.execPath)}`,
    );
    await editor.close();
  });
});
