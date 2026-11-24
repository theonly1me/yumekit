import { describe, expect, it } from "vitest";
import {
  connectCodexImages,
  resultText,
} from "./testing/connectCodexImages.ts";

describe("the chat model and the reasoning effort of the picture turn", () => {
  it("passes the model and the effort of the settings to Codex", async () => {
    const codex = await connectCodexImages({
      environment: {
        YUMEKIT_CODEX_MODEL: "gpt-6.1-sol",
        YUMEKIT_CODEX_EFFORT: "high",
      },
    });

    const result = await codex.makePicture();

    const [run] = await codex.runs();
    const flags = run?.arguments ?? [];
    expect(result.isError).toBeFalsy();
    expect(flags.slice(flags.indexOf("-m"), flags.indexOf("-m") + 2)).toEqual([
      "-m",
      "gpt-6.1-sol",
    ]);
    expect(flags).toContain('model_reasoning_effort="high"');
    expect(flags.indexOf("-m")).toBeLessThan(flags.indexOf("--"));
  });

  it("sends no model and no effort when the settings are not set", async () => {
    const codex = await connectCodexImages({
      environment: { YUMEKIT_CODEX_MODEL: "", YUMEKIT_CODEX_EFFORT: " " },
    });

    await codex.makePicture();

    const [run] = await codex.runs();
    const flags = run?.arguments ?? [];
    expect(flags).not.toContain("-m");
    expect(
      flags.some((flag) => flag.startsWith("model_reasoning_effort")),
    ).toBe(false);
  });

  it("names the model setting when Codex refuses the model", async () => {
    const codex = await connectCodexImages({
      scenario: { turn: "model-refused" },
      environment: { YUMEKIT_CODEX_MODEL: "gpt-unknown" },
    });

    const result = await codex.makePicture();

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      `Codex refused the chat model "gpt-unknown" that the setting YUMEKIT_CODEX_MODEL names: The 'gpt-unknown' model is not supported when using Codex with a ChatGPT account. Set YUMEKIT_CODEX_MODEL to a model of your ChatGPT plan, or remove it to use the default model of Codex.`,
    );
  });

  it("names the effort setting when Codex refuses the effort", async () => {
    const codex = await connectCodexImages({
      scenario: { turn: "effort-refused" },
      environment: { YUMEKIT_CODEX_EFFORT: "bogus" },
    });

    const result = await codex.makePicture();

    expect(resultText(result)).toMatch(
      /^Codex refused the reasoning effort "bogus" that the setting YUMEKIT_CODEX_EFFORT names: .*Invalid value: 'bogus'.* Set YUMEKIT_CODEX_EFFORT to a level of the model, or remove it to use the default of Codex\.$/,
    );
  });
});
