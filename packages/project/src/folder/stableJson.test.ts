import { describe, expect, it } from "vitest";
import {
  createTestProject,
  readFolderFiles,
} from "../testing/projectFixtures.js";

function withoutHistory(files: Map<string, string>): Map<string, string> {
  return new Map([...files].filter(([file]) => !file.startsWith(".yumekit")));
}

describe("stable file output", () => {
  it("gives identical bytes for the same snapshot written twice with keys in a different order", async () => {
    const first = await createTestProject();
    const second = await createTestProject();
    await first.applyEdits([
      {
        kind: "putScene",
        scene: {
          id: "intro",
          title: "Intro",
          notes: "",
          source: {
            kind: "kit",
            component: "title-card",
            props: { text: "Hi", size: 2 },
          },
        },
      },
    ]);
    await second.applyEdits([
      {
        kind: "putScene",
        scene: {
          source: {
            props: { size: 2, text: "Hi" },
            component: "title-card",
            kind: "kit",
          },
          notes: "",
          title: "Intro",
          id: "intro",
        },
      },
    ]);
    const firstFiles = withoutHistory(await readFolderFiles(first.folder));
    expect(withoutHistory(await readFolderFiles(second.folder))).toEqual(
      firstFiles,
    );
    expect(firstFiles.get("scenes/intro/scene.json")).toBe(
      [
        "{",
        '  "id": "intro",',
        '  "notes": "",',
        '  "source": {',
        '    "component": "title-card",',
        '    "kind": "kit",',
        '    "props": {',
        '      "size": 2,',
        '      "text": "Hi"',
        "    }",
        "  },",
        '  "title": "Intro"',
        "}",
        "",
      ].join("\n"),
    );
  });

  it("writes the same bytes after undo and redo of an edit", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      {
        kind: "setBible",
        bible: { voice: "calm", style: "flat", palette: ["#000000"], cast: [] },
      },
    ]);
    const before = withoutHistory(await readFolderFiles(store.folder));
    await store.undo();
    await store.redo();
    expect(withoutHistory(await readFolderFiles(store.folder))).toEqual(before);
  });
});
