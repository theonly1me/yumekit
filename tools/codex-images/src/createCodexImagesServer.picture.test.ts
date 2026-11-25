import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectCodexImages,
  resultText,
} from "./testing/connectCodexImages.ts";

describe("a picture from Codex", () => {
  it("returns the picture of the turn in the output folder with its real size", async () => {
    const codex = await connectCodexImages({});

    const result = await codex.makePicture({
      width_pixels: 1920,
      height_pixels: 1080,
    });

    const path = join(codex.outputDirectory, "mug.png");
    expect(result.structuredContent).toEqual({
      files: [{ path, kind: "image", width_pixels: 1536, height_pixels: 1024 }],
      cost_usd: 0,
    });
    const bytes = await readFile(path);
    expect(bytes.readUInt32BE(16)).toBe(1536);
  });

  it("removes the picture folder of its turn from the Codex folder", async () => {
    const codex = await connectCodexImages({});

    await codex.makePicture();

    const [run] = await codex.runs();
    await expect(
      access(join(codex.codexHome, "generated_images", run?.threadId ?? "")),
    ).rejects.toThrow(/ENOENT/);
  });

  it("runs one sandboxed turn that keeps no session, loads no user configuration, and has no shell", async () => {
    const codex = await connectCodexImages({});

    await codex.makePicture({ reference_image_paths: ["/tmp/hero.png"] });

    const [run] = await codex.runs();
    const flags = run?.arguments ?? [];
    expect(flags.slice(0, 2)).toEqual(["exec", "--json"]);
    expect(flags).toEqual(
      expect.arrayContaining([
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "read-only",
        "shell_tool",
        "computer_use",
        'approval_policy="never"',
        'web_search="disabled"',
      ]),
    );
    expect(flags).not.toContain("resume");
    expect(
      flags.slice(flags.indexOf("--image"), flags.indexOf("--image") + 2),
    ).toEqual(["--image", "/tmp/hero.png"]);
    expect(flags.at(-1)).toContain("Picture: a red mug");
  });

  it("tells Codex how to use the references and adds nothing about what to draw", async () => {
    const codex = await connectCodexImages({});

    await codex.makePicture({ reference_image_paths: ["/tmp/hero.png"] });

    const [run] = await codex.runs();
    const prompt = run?.arguments.at(-1) ?? "";
    expect(prompt).toContain(
      "The 1 attached picture(s) are references. Use them as the reference images of the image generation tool.",
    );
    expect(prompt).not.toMatch(/keep the same|character|clothes|colors|style/i);
  });

  it("fails when the turn ends with no picture file", async () => {
    const codex = await connectCodexImages({ scenario: { turn: "no-file" } });

    const result = await codex.makePicture();

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "Codex finished, but it made no picture. Codex said: I made the picture.",
    );
  });

  it("fails and keeps no file when Codex wrote a file that is not a picture", async () => {
    const codex = await connectCodexImages({
      scenario: { turn: "not-a-picture" },
    });

    const result = await codex.makePicture();

    expect(resultText(result)).toBe(
      "Codex wrote a file that is not a PNG picture.",
    );
    await expect(
      access(join(codex.outputDirectory, "mug.png")),
    ).rejects.toThrow(/ENOENT/);
  });

  it("fails when the picture has another shape than the asked one", async () => {
    const codex = await connectCodexImages({
      scenario: { width: 1024, height: 1536 },
    });

    const result = await codex.makePicture({
      width_pixels: 1920,
      height_pixels: 1080,
    });

    expect(resultText(result)).toContain(
      "Codex made a portrait picture of 1024 by 1536 pixels, not the asked landscape shape of 1920 by 1080.",
    );
  });

  it("marks a usage limit of the plan as its own kind of failure", async () => {
    const codex = await connectCodexImages({
      scenario: { turn: "usage-limit" },
    });

    const result = await codex.makePicture();

    expect(result.isError).toBe(true);
    expect(result._meta).toEqual({ "yumekit/failure": "usage-limit-reached" });
    expect(resultText(result)).toBe(
      "Codex reached the usage limit of your ChatGPT plan: You’ve hit your usage limit. Try again at 4:12 PM.",
    );
  });

  it("stops Codex and fails when the turn passes its time limit", async () => {
    const codex = await connectCodexImages({
      scenario: { turn: "hang" },
      turnLimitSeconds: 1,
    });

    const result = await codex.makePicture();

    expect(resultText(result)).toBe("Codex made no picture within 1 seconds.");
  });
});
