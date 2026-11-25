import { readdirSync } from "node:fs";
import { createServer } from "node:http";
import { describe, expect, inject, it, onTestFinished } from "vitest";
import { configurationDirectory } from "../../configurationDirectory.js";
import { allowTestHosts, takeBlockedRequests } from "./fetchGuard.js";
import { removeMediaKeys } from "./removeMediaKeys.js";

async function localServer(): Promise<string> {
  const server = createServer((...[, response]) => {
    response.end("local");
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  onTestFinished(() => {
    server.close();
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The test server has no port");
  }
  return `http://127.0.0.1:${String(address.port)}/`;
}

describe("the guard of every test", () => {
  it("removes each key that a media server declares, and gives the test an empty configuration folder", () => {
    const variables = inject("mediaKeyVariables");
    const environment = { OPENAI_API_KEY: "made-up", PATH: "/bin" };

    removeMediaKeys({ environment, variables });

    expect(variables).toEqual(
      expect.arrayContaining(["OPENAI_API_KEY", "GEMINI_API_KEY", "FAL_KEY"]),
    );
    expect(environment).toEqual({ PATH: "/bin" });
    expect(variables.filter((name) => process.env[name] !== undefined)).toEqual(
      [],
    );
    expect(readdirSync(configurationDirectory())).toEqual([]);
  });

  it("refuses a request to the host of a media service with a clear message", async () => {
    const asked = fetch("https://api.openai.com/v1/models");

    await expect(asked).rejects.toThrow(
      "A test asked for https://api.openai.com/v1/models. No test may reach a real service",
    );
    expect(takeBlockedRequests()).toEqual(["https://api.openai.com/v1/models"]);
  });

  it("lets a request to 127.0.0.1 and to a host that the test declares through", async () => {
    const local = await fetch(await localServer());
    allowTestHosts(["declared.invalid"]);

    const declared = await fetch("http://declared.invalid/").catch(
      (error: unknown) => (error instanceof Error ? error.message : ""),
    );

    expect(await local.text()).toBe("local");
    expect(declared).not.toContain("A test asked for");
    expect(takeBlockedRequests()).toEqual([]);
  });
});
