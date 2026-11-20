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
});
