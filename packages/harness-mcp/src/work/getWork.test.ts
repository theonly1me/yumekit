import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { workCharacterLimit } from "./workText/index.js";
import { filmWork, layoutCode } from "./workFixture.js";

function bigScene(index: number) {
  const padding = `export const words${String(index)} = "${"x".repeat(12_000)}";\n`;
  return {
    scene_id: `big-${String(index)}`,
    title: `Big ${String(index)}`,
    code: `${padding}import { defineReactScene } from "@yumekit/scene";\nexport default defineReactScene(() => <p>{words${String(index)}.length}</p>);\n`,
  };
}

describe("get_work", () => {
  it("gives the story, the shared code, the code of each scene, the timeline in beats, and the assets in one text, in that order", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "set_script",
      arguments: { script: "Fast. Clear. Made with code." },
    });
    await harness.call({ name: "set_tempo", arguments: { tempo: 120 } });
    await harness.call({ name: "put_work", arguments: filmWork });

    const work = await harness.call({ name: "get_work" });
    const text =
      work.result.content[1]?.type === "text"
        ? work.result.content[1].text
        : "";

    const order = [
      "## Story",
      "Fast. Clear. Made with code.",
      "## Shared code",
      layoutCode.trimEnd(),
      "### Scene end",
      "### Scene hook",
      'import { ink, margin } from "./_shared/layout";',
      "## Timelines",
      "- proof: scene proof, beats 4 to 8 (frames 60 to 120)",
      "## Assets",
    ].map((part) => text.indexOf(part));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...Float64Array.from(order).sort()]);
    expect(text).toContain("Tempo 120 beats each minute, 15 frames each beat");
    expect(text).toContain('Props: {"heading":"Made with code"}');
    expect(work.data).toMatchObject({ part: "all", left_out: [] });
  });

  it("gives as much scene code as fits the size limit, names the rest, and gives it part by part", async () => {
    const harness = await startHarness();
    const scenes = [0, 1, 2, 3, 4, 5].map(bigScene);
    const put = await harness.call({ name: "put_work", arguments: { scenes } });

    const all = await harness.call({ name: "get_work" });
    const code = await harness.call({
      name: "get_work",
      arguments: { part: "code" },
    });
    const two = await harness.call({
      name: "get_work",
      arguments: { part: "code", scene_ids: ["big-4", "big-5"] },
    });

    expect(put.isError).toBe(false);
    expect(Number(all.data["characters"])).toBeLessThan(workCharacterLimit);
    expect(all.data["left_out"]).toEqual(["big-4", "big-5"]);
    expect(all.text).toContain("words3");
    expect(all.text).toContain('Call get_work with part "code"');
    expect(Number(code.data["characters"])).toBeLessThan(workCharacterLimit);
    expect(code.data["left_out"]).toEqual(["big-4", "big-5"]);
    expect(two.data["left_out"]).toEqual([]);
    expect(two.text).toContain("words5");
    expect(two.text).not.toContain("words1");
  });
});
