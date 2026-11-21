import * as fileSystem from "node:fs/promises";
import { readdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { saveKey } from "../index.js";
import { useTemporaryKeyFolder } from "./testing/keyFolder.js";

vi.mock("node:fs/promises", async (importOriginal) => {
  const original = await importOriginal<typeof fileSystem>();
  return { ...original, rename: vi.fn(original.rename) };
});

const testValue = "made-up-test-value-2";

describe("saveKey failures", () => {
  it.each([
    { case: "an empty value", variable: "TEST_API_KEY", value: "" },
    {
      case: "a value with a line break",
      variable: "TEST_API_KEY",
      value: "made-up\nvalue",
    },
    { case: "a lower case name", variable: "test_api_key", value: testValue },
    { case: "a one letter name", variable: "T", value: testValue },
    { case: "a name with a dash", variable: "TEST-KEY", value: testValue },
  ])("rejects $case with key-not-valid and names no value", async (entry) => {
    const { keyFile } = await useTemporaryKeyFolder();

    const saved = await saveKey({
      variable: entry.variable,
      value: entry.value,
    });

    expect(saved).toMatchObject({
      ok: false,
      failure: { kind: "key-not-valid", variable: entry.variable },
    });
    expect(JSON.stringify(saved)).not.toContain(testValue);
    await expect(readFile(keyFile)).rejects.toThrow();
  });

  it("keeps the old file when the rename after the write fails", async () => {
    const { keyFile } = await useTemporaryKeyFolder();
    await saveKey({ variable: "TEST_API_KEY", value: testValue });
    vi.mocked(fileSystem.rename).mockRejectedValueOnce(
      new Error("stopped before the rename"),
    );

    const saved = await saveKey({
      variable: "TEST_API_KEY",
      value: "made-up-new-value",
    });

    expect(saved).toEqual({
      ok: false,
      failure: {
        kind: "key-file-not-writable",
        file: keyFile,
        message: "stopped before the rename",
      },
    });
    expect(JSON.parse(await readFile(keyFile, "utf8"))).toEqual({
      TEST_API_KEY: testValue,
    });
    expect(await readdir(dirname(keyFile))).toEqual(["keys.json"]);
  });

  it("returns key-file-not-writable with the path when the key file is not valid JSON", async () => {
    const { keyFile } = await useTemporaryKeyFolder();
    await fileSystem.mkdir(dirname(keyFile), { recursive: true });
    await fileSystem.writeFile(keyFile, "{ not json");

    const saved = await saveKey({ variable: "TEST_API_KEY", value: testValue });

    expect(saved).toMatchObject({
      ok: false,
      failure: { kind: "key-file-not-writable", file: keyFile },
    });
    expect(await readFile(keyFile, "utf8")).toBe("{ not json");
  });
});
