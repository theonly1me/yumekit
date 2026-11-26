import { describe, expect, it } from "vitest";
import { startFunctionHarness } from "../testing/functionHarness.js";

describe("createHarness failures", () => {
  it("call with a name that is not a tool returns tool-not-found", async () => {
    const { harness } = await startFunctionHarness();

    const result = await harness.call({ name: "delete_everything", input: {} });

    expect(result.isError).toBe(true);
    expect(result.data).toMatchObject({
      kind: "tool-not-found",
      message: 'The harness has no tool "delete_everything".',
    });
  });

  it("call with input that does not match the schema returns invalid-input and changes nothing", async () => {
    const { harness, store } = await startFunctionHarness();

    const result = await harness.call({
      name: "set_script",
      input: { script: 5 },
    });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("invalid-input");
    expect(result.data["message"]).toContain("script");
    expect(store.read().revision).toBe(0);
  });

  it("call after close returns harness-closed", async () => {
    const { harness } = await startFunctionHarness();
    await harness.close();

    const result = await harness.call({ name: "get_project", input: {} });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("harness-closed");
  });
});
