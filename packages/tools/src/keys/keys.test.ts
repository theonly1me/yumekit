import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { readKeyStates, removeKey, saveKey } from "../index.js";
import { useTemporaryKeyFolder } from "./testing/keyFolder.js";

const testValue = "made-up-test-value-1";

async function modeOf(path: string): Promise<number> {
  return (await stat(path)).mode & 0o777;
}

describe("the key file", () => {
  it("saves a key that readKeyStates then gives as key-file, in a 0600 file inside a 0700 folder", async () => {
    const { keyFile, configurationDirectory } = await useTemporaryKeyFolder();

    const saved = await saveKey({ variable: "TEST_API_KEY", value: testValue });
    const states = await readKeyStates({
      variables: ["TEST_API_KEY", "OTHER_API_KEY"],
    });

    expect(saved).toEqual({ ok: true, value: { saved: true } });
    expect(states).toEqual([
      { variable: "TEST_API_KEY", source: "key-file" },
      { variable: "OTHER_API_KEY", source: "missing" },
    ]);
    expect(await modeOf(keyFile)).toBe(0o600);
    expect(await modeOf(configurationDirectory)).toBe(0o700);
    expect(JSON.parse(await readFile(keyFile, "utf8"))).toEqual({
      TEST_API_KEY: testValue,
    });
  });

  it("sets an existing folder with mode 0755 to 0700 when it saves a key", async () => {
    const { configurationDirectory } = await useTemporaryKeyFolder();
    await mkdir(configurationDirectory, { recursive: true, mode: 0o755 });
    await chmod(configurationDirectory, 0o755);

    await saveKey({ variable: "TEST_API_KEY", value: testValue });

    expect(await modeOf(configurationDirectory)).toBe(0o700);
  });

  it("corrects a key file with mode 0644 to 0600 when it reads the file", async () => {
    const { keyFile, configurationDirectory } = await useTemporaryKeyFolder();
    await mkdir(configurationDirectory, { recursive: true });
    await writeFile(keyFile, JSON.stringify({ TEST_API_KEY: testValue }));
    await chmod(keyFile, 0o644);

    const states = await readKeyStates({ variables: ["TEST_API_KEY"] });

    expect(states).toEqual([{ variable: "TEST_API_KEY", source: "key-file" }]);
    expect(await modeOf(keyFile)).toBe(0o600);
  });

  it("lets an environment variable win over the key file", async () => {
    await useTemporaryKeyFolder();
    await saveKey({ variable: "TEST_API_KEY", value: testValue });
    vi.stubEnv("TEST_API_KEY", "made-up-environment-value");

    const states = await readKeyStates({ variables: ["TEST_API_KEY"] });

    expect(states).toEqual([
      { variable: "TEST_API_KEY", source: "environment" },
    ]);
  });

  it("removes one key and keeps the others", async () => {
    const { keyFile } = await useTemporaryKeyFolder();
    await saveKey({ variable: "TEST_API_KEY", value: testValue });
    await saveKey({ variable: "OTHER_API_KEY", value: "made-up-other" });

    const removed = await removeKey({ variable: "TEST_API_KEY" });
    const removedAgain = await removeKey({ variable: "TEST_API_KEY" });

    expect(removed).toEqual({ ok: true, value: { removed: true } });
    expect(removedAgain).toEqual({ ok: true, value: { removed: false } });
    expect(JSON.parse(await readFile(keyFile, "utf8"))).toEqual({
      OTHER_API_KEY: "made-up-other",
    });
  });

  it("gives missing for each key when no key file exists", async () => {
    await useTemporaryKeyFolder();

    const states = await readKeyStates({ variables: ["TEST_API_KEY"] });

    expect(states).toEqual([{ variable: "TEST_API_KEY", source: "missing" }]);
  });
});
