import { describe, expect, it } from "vitest";
import {
  connectFixture,
  connectFixtureOutcome,
} from "./testing/mediaToolsFixture.js";

describe("connectMediaTools limits", () => {
  it("gives 30 generated video seconds when no file sets a limit", async () => {
    const { tools } = await connectFixture({});

    expect(tools.limits()).toEqual({ generatedVideoSeconds: 30 });
  });

  it("uses the limit of the user file when the project file has none", async () => {
    const { tools } = await connectFixture({
      userFile: { limits: { generatedVideoSeconds: 12 } },
      projectFile: { mcpServers: { sample: {} } },
    });

    expect(tools.limits()).toEqual({ generatedVideoSeconds: 12 });
  });

  it("lets the project file win over the user file", async () => {
    const { tools } = await connectFixture({
      userFile: { limits: { generatedVideoSeconds: 12 } },
      projectFile: { limits: { generatedVideoSeconds: 0 } },
    });

    expect(tools.limits()).toEqual({ generatedVideoSeconds: 0 });
  });

  it("rejects a negative limit as invalid-configuration-file", async () => {
    const { outcome } = await connectFixtureOutcome({
      projectFile: { limits: { generatedVideoSeconds: -1 } },
    });

    expect(outcome.ok ? "connected" : outcome.failure).toMatchObject({
      kind: "invalid-configuration-file",
    });
  });
});
