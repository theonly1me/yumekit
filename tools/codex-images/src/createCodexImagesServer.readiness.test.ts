import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  connectCodexImages,
  resultText,
} from "./testing/connectCodexImages.ts";

const checkSchema = z.object({ valid: z.boolean(), message: z.string() });

async function checkOf(options: Parameters<typeof connectCodexImages>[0]) {
  const codex = await connectCodexImages(options);
  return checkSchema.parse(
    (await codex.callTool({ name: "check_key" })).structuredContent,
  );
}

describe("Codex pictures, ready or not", () => {
  it("describes one picture model with no key, a price of 0, and reference pictures", async () => {
    const codex = await connectCodexImages({});

    expect(
      (await codex.callTool({ name: "describe_media_server" }))
        .structuredContent,
    ).toMatchObject({
      label: "Codex, with your ChatGPT plan",
      runs: "hosted",
      keys: [],
      models: [
        {
          id: "gpt-image-2",
          capability: "image",
          is_default: true,
          prices: [{ usd: 0, unit: "image", when: {} }],
          accepts: ["reference_images"],
          tested: true,
        },
      ],
    });
  });

  it("is ready when Codex is installed, signed in with ChatGPT, and has the picture feature", async () => {
    expect(await checkOf({})).toEqual({
      valid: true,
      message: "Codex is ready to make pictures.",
    });
  });

  it("says how to install Codex when the program is not there", async () => {
    const check = await checkOf({ installed: false });

    expect(check.valid).toBe(false);
    expect(check.message).toContain(
      "yumekit did not find the Codex program on this computer. Install Codex",
    );
  });

  it("says to run codex login when Codex is signed out", async () => {
    const check = await checkOf({ scenario: { signIn: "none" } });

    expect(check.valid).toBe(false);
    expect(check.message).toMatch(
      /^Codex is not signed in\. Open a terminal and run: codex login\./,
    );
  });

  it("is not ready with an API key sign-in, so no picture spends money on that key", async () => {
    const check = await checkOf({ scenario: { signIn: "api-key" } });

    expect(check.valid).toBe(false);
    expect(check.message).toContain("signed in with an API key");
  });

  it("asks for an update when the Codex version has no picture feature", async () => {
    const check = await checkOf({ scenario: { hasFeature: false } });

    expect(check.valid).toBe(false);
    expect(check.message).toContain("run: codex update");
  });

  it("fails a picture call with the reason and starts no turn when Codex is signed out", async () => {
    const codex = await connectCodexImages({ scenario: { signIn: "none" } });

    const result = await codex.makePicture();

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("Codex is not signed in.");
    await expect(codex.runs()).rejects.toThrow(/ENOENT/);
  });
});
