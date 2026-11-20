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
});
