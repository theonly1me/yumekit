import { describe, expect, it } from "vitest";
import { startFunctionHarness } from "../testing/functionHarness.js";

describe("the description of generate_asset", () => {
  it("names the input pronunciations for a name that the voice does not know", async () => {
    const { harness } = await startFunctionHarness();

    const tool = harness.tools.find(
      (candidate) => candidate.name === "generate_asset",
    );

    expect(JSON.stringify(tool?.inputSchema)).toContain(
      'pronunciations for a name that the voice does not know, for example {\\"Hoshi\\": \\"hoe she\\"}',
    );
  });
});
