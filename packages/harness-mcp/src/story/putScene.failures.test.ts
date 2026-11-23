import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

async function putScene(options: {
  harness: Harness;
  arguments: Record<string, unknown>;
}) {
  const before = options.harness.store.read().revision;
  const result = await options.harness.call({
    name: "put_scene",
    arguments: { scene_id: "scene", title: "Scene", ...options.arguments },
  });
  return {
    result,
    revisionChanged: options.harness.store.read().revision !== before,
  };
}

describe("put_scene failures", () => {
  it("rejects an unknown kit prop with a hint that lists each valid prop", async () => {
    const harness = await startHarness();

    const { result, revisionChanged } = await putScene({
      harness,
      arguments: {
        kit_component: "title-card",
        props: { heading: "Hi", subtitle: "wrong name" },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("invalid-props");
    expect(result.data["message"]).toContain("subtitle");
    expect(result.data["hint"]).toContain("heading (required)");
    expect(result.data["hint"]).toContain("subheading (optional)");
    expect(revisionChanged).toBe(false);
  });

  it("gives the path of each rejected kit prop, so an editor can show it next to its field", async () => {
    const harness = await startHarness();

    const { result } = await putScene({
      harness,
      arguments: {
        kit_component: "bar-chart",
        props: { heading: "Costs", bars: [{ label: "A", value: "ten" }] },
      },
    });

    expect(result.data["kind"]).toBe("invalid-props");
    expect(result.data["issues"]).toEqual([
      {
        path: ["bars", 0, "value"],
        message: "Invalid input: expected number, received string",
      },
    ]);
  });

  it("rejects an unknown kit component with a hint that lists the kit scenes", async () => {
    const harness = await startHarness();

    const { result } = await putScene({
      harness,
      arguments: { kit_component: "pie-chart", props: {} },
    });

    expect(result.data["kind"]).toBe("kit-scene-not-found");
    expect(result.data["hint"]).toContain("title-card, bullet-list");
    expect(result.data["hint"]).toContain("list_kit_scenes");
  });

  it("returns the compiler message and points at the line and the scene guide", async () => {
    const harness = await startHarness();

    const { result, revisionChanged } = await putScene({
      harness,
      arguments: {
        code: 'import { defineReactScene } from "@yumekit/scene";\nconst size: number = "large";\nexport default defineReactScene(() => <div>{size}</div>);\n',
      },
    });

    expect(result.data["kind"]).toBe("scene-compile-failed");
    expect(result.data["message"]).toContain("line 2");
    expect(result.data["hint"]).toContain("line 2");
    expect(result.data["hint"]).toContain("get_scene_guide");
    expect(revisionChanged).toBe(false);
  });

  it("rejects an import that is not permitted with a hint that lists the permitted imports", async () => {
    const harness = await startHarness();

    const { result } = await putScene({
      harness,
      arguments: {
        code: 'import { defineReactScene } from "@yumekit/scene";\nimport confetti from "canvas-confetti";\nexport default defineReactScene(() => <div>{String(confetti)}</div>);\n',
      },
    });

    expect(result.data["kind"]).toBe("scene-import-not-permitted");
    expect(result.data["hint"]).toContain("canvas-confetti");
    expect(result.data["hint"]).toContain(
      "react, @yumekit/scene, @yumekit/scene-kit, @yumekit/scene-kit/motion, and the shared code of the project as ./_shared/<name>",
    );
  });

  it("asks for exactly one of kit_component and code", async () => {
    const harness = await startHarness();

    const both = await putScene({
      harness,
      arguments: { kit_component: "title-card", code: "export default 1;" },
    });
    const neither = await putScene({ harness, arguments: {} });

    for (const { result } of [both, neither]) {
      expect(result.data["kind"]).toBe("scene-source-missing");
      expect(result.data["hint"]).toContain("list_kit_scenes");
      expect(result.data["hint"]).toContain("get_scene_guide");
    }
  });
});
