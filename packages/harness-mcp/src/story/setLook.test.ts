import { lookIds } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startHarness } from "../testing/harnessFixture.js";

describe("the look tools", () => {
  it("get_project gives paper for a project with no look", async () => {
    const harness = await startHarness();

    const { data } = await harness.call({ name: "get_project" });

    expect(data["look"]).toBe("paper");
  });

  it("set_look changes the look as one undo step, and get_project gives it", async () => {
    const harness = await startHarness();

    const changed = await harness.call({
      name: "set_look",
      arguments: { look: "editorial" },
    });
    const { data } = await harness.call({ name: "get_project" });
    await harness.call({ name: "undo" });

    expect(changed.isError).toBe(false);
    expect(changed.data["look"]).toBe("editorial");
    expect(data["look"]).toBe("editorial");
    expect(harness.store.read().project.look).toBeUndefined();
  });

  it("get_project gives calm false for a project with no value", async () => {
    const harness = await startHarness();

    const { data } = await harness.call({ name: "get_project" });

    expect(data["calm"]).toBe(false);
  });

  it("set_look with only calm keeps the look, and a later look keeps calm", async () => {
    const harness = await startHarness();
    await harness.call({ name: "set_look", arguments: { look: "neon" } });

    const calmed = await harness.call({
      name: "set_look",
      arguments: { calm: true },
    });
    await harness.call({ name: "set_look", arguments: { look: "studio" } });
    const { data } = await harness.call({ name: "get_project" });

    expect(calmed.data).toMatchObject({ look: "neon", calm: true });
    expect(data).toMatchObject({ look: "studio", calm: true });
  });

  it("set_look with neither look nor calm fails and changes nothing", async () => {
    const harness = await startHarness();

    const result = await harness.call({ name: "set_look", arguments: {} });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("invalid-value");
    expect(harness.store.read().project).not.toHaveProperty("look");
  });

  it("set_look refuses a look that yumekit does not have and changes nothing", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "set_look",
      arguments: { look: "sepia" },
    });

    expect(result.isError).toBe(true);
    expect(harness.store.read().project.look).toBeUndefined();
  });

  it("list_kit_scenes gives each look of the project format with a label and one line", async () => {
    const harness = await startHarness();

    const { data } = await harness.call({ name: "list_kit_scenes" });

    const listed = z
      .array(
        z.strictObject({ id: z.string(), label: z.string(), line: z.string() }),
      )
      .parse(data["looks"]);
    expect(listed.map((look) => look.id)).toEqual([...lookIds]);
    expect(listed.every((look) => look.label !== "" && look.line !== "")).toBe(
      true,
    );
  });
});
