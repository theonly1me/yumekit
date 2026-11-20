import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  keyedServerEntry,
  testKeyValue,
  writeUserMediaTools,
} from "../../testing/keyedServer.js";
import { createCliWorkspace } from "../../testing/runCli.js";

async function keyedWorkspace() {
  const workspace = await createCliWorkspace();
  await writeUserMediaTools({
    configurationDirectory: workspace.configurationDirectory,
    content: { mcpServers: { keyed: keyedServerEntry } },
  });
  return workspace;
}

describe("yumekit keys", () => {
  it("lists each server, each key, its state, and the guide for a missing key", async () => {
    const workspace = await keyedWorkspace();

    const run = await workspace.run(["keys"]);

    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain(
      `Key file: ${join(workspace.configurationDirectory, "keys.json")}`,
    );
    expect(run.stdout).toContain("keyed (Keyed test server):");
    expect(run.stdout).toContain("  YUMEKIT_TEST_KEY: missing");
    expect(run.stdout).toContain("    Get it at https://example.com/keys");
    expect(run.stdout).toContain("    1. Open the key page.");
    expect(run.stdout).toContain(
      "    Then run: yumekit keys set YUMEKIT_TEST_KEY",
    );
    expect(run.stdout).toContain(
      "sample (Sample (free test server)): needs no key",
    );
    expect(run.stdout).toContain("openai (OpenAI):\n  OPENAI_API_KEY: missing");
  });

  it("reads the value of keys set from standard input, saves it with mode 0600, and prints no value", async () => {
    const workspace = await keyedWorkspace();
    const keyFile = join(workspace.configurationDirectory, "keys.json");

    const set = await workspace.runWithInput({
      args: ["keys", "set", "YUMEKIT_TEST_KEY"],
      input: `${testKeyValue}\n`,
    });
    const listed = await workspace.run(["keys"]);

    expect(set.exitCode).toBe(0);
    expect(set.stdout).toBe(`Saved YUMEKIT_TEST_KEY in ${keyFile}.\n`);
    expect(JSON.parse(await readFile(keyFile, "utf8"))).toEqual({
      YUMEKIT_TEST_KEY: testKeyValue,
    });
    expect((await stat(keyFile)).mode & 0o777).toBe(0o600);
    expect(listed.stdout).toContain("  YUMEKIT_TEST_KEY: key-file");
    for (const output of [
      set.stdout,
      set.stderr,
      listed.stdout,
      listed.stderr,
    ]) {
      expect(output).not.toContain(testKeyValue);
    }
  });

  it("removes a key from the key file", async () => {
    const workspace = await keyedWorkspace();
    await workspace.runWithInput({
      args: ["keys", "set", "YUMEKIT_TEST_KEY"],
      input: testKeyValue,
    });

    const removed = await workspace.run(["keys", "remove", "YUMEKIT_TEST_KEY"]);
    const listed = await workspace.run(["keys"]);

    expect(removed.exitCode).toBe(0);
    expect(removed.stdout).toContain("Removed YUMEKIT_TEST_KEY from");
    expect(listed.stdout).toContain("  YUMEKIT_TEST_KEY: missing");
  });

  it("refuses a value as a command argument and saves nothing", async () => {
    const workspace = await keyedWorkspace();

    const run = await workspace.run([
      "keys",
      "set",
      "YUMEKIT_TEST_KEY",
      testKeyValue,
    ]);

    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("The value is never an argument.");
    expect(run.stderr).not.toContain(testKeyValue);
    await expect(
      readFile(join(workspace.configurationDirectory, "keys.json")),
    ).rejects.toThrow();
  });

  it("rejects an empty value from standard input with exit code 1", async () => {
    const workspace = await keyedWorkspace();

    const run = await workspace.runWithInput({
      args: ["keys", "set", "YUMEKIT_TEST_KEY"],
      input: "\n",
    });

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain("The value is empty.");
  });
});
