import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findBundledServers } from "./bundledServers.js";

describe("findBundledServers", () => {
  it("resolves the Gemini server by the name gemini and passes its key and its variables", async () => {
    const servers = await findBundledServers();

    expect(servers["gemini"]).toEqual({
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL("../../../tools/gemini-media/dist/main.js", import.meta.url),
        ),
      ],
      passEnvironment: [
        "GEMINI_API_KEY",
        "YUMEKIT_GEMINI_VIDEO_MODEL",
        "YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS",
      ],
    });
  });

  it("resolves the fal server by the name fal and passes it FAL_KEY", async () => {
    const servers = await findBundledServers();

    expect(servers["fal"]).toEqual({
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL("../../../tools/fal-media/dist/main.js", import.meta.url),
        ),
      ],
      passEnvironment: ["FAL_KEY"],
    });
  });

  it("resolves the local voice by the name local-voice and passes it the configuration folder", async () => {
    const servers = await findBundledServers();

    expect(servers["local-voice"]).toEqual({
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL("../../../tools/local-voice/dist/main.js", import.meta.url),
        ),
      ],
      passEnvironment: ["YUMEKIT_CONFIG_DIRECTORY"],
    });
  });

  it("resolves the music of this computer by the name local-music, with no key and no variable", async () => {
    const servers = await findBundledServers();

    expect(servers["local-music"]).toEqual({
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL("../../../tools/local-music/dist/main.js", import.meta.url),
        ),
      ],
    });
  });

  it("resolves the pictures of Codex by the name codex, with no key and the Codex folder and program path", async () => {
    const servers = await findBundledServers();

    expect(servers["codex"]).toEqual({
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL("../../../tools/codex-images/dist/main.js", import.meta.url),
        ),
      ],
      passEnvironment: ["CODEX_HOME", "YUMEKIT_CODEX_PATH"],
    });
  });
});
