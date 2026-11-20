import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findBundledServers } from "./bundledServers.js";

describe("findBundledServers", () => {
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
