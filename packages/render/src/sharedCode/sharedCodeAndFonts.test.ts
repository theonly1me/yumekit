import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { createPictureRenderer } from "../index.js";
import { renderPackageDirectory } from "../packagePaths.js";
import {
  changeProject,
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { valueOf } from "../testing/valueOf.js";

const fontFile = join(
  renderPackageDirectory,
  "..",
  "scene-kit",
  "fonts",
  "Fraunces-SemiBold-latin.woff2",
);

const themeCode = (color: string) => `export const theme = {
  family: "Project Serif",
  color: "${color}",
};
`;

const titleCode = `import { defineReactScene, useFrame } from "@yumekit/scene";
import { theme } from "./_shared/theme";

export default defineReactScene(() => {
  const frame = useFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#101014" }}>
      <h1 style={{ margin: 0, padding: 12, fontFamily: theme.family, fontSize: 64, color: theme.color, opacity: Math.min(1, frame / 10) }}>
        Quiet launch
      </h1>
    </div>
  );
});
`;

async function fontAsset(folder: string): Promise<Edit> {
  await mkdir(join(folder, "assets", "files"), { recursive: true });
  await copyFile(fontFile, join(folder, "assets", "files", "serif.woff2"));
  return {
    kind: "addAsset",
    asset: {
      id: "serif",
      kind: "font",
      file: "assets/files/serif.woff2",
      source: { kind: "import", originalName: "serif.woff2" },
    },
  };
}

function titleProject(options: { withFont: boolean }) {
  return createRenderProject({
    edits: async (store) => [
      await fontAsset(store.folder),
      ...(options.withFont
        ? [
            {
              kind: "setFonts" as const,
              fonts: [{ assetId: "serif", family: "Project Serif" }],
            },
          ]
        : []),
      { kind: "putSharedCode", name: "theme", code: themeCode("#ffffff") },
      moduleScene({ sceneId: "title", code: titleCode }),
      sceneTracks({
        tracks: [
          [
            {
              id: "title",
              sceneId: "title",
              startFrame: 0,
              durationFrames: 30,
            },
          ],
        ],
      }),
    ],
  });
}

async function picturesOf(options: { folder: string; frames: number[] }) {
  const pictures = createPictureRenderer({ folder: options.folder });
  try {
    const drawn = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: options.frames }),
    );
    return drawn.map((picture) => Buffer.from(picture.png));
  } finally {
    await pictures.close();
  }
}

const runOfFrames = Array.from({ length: 21 }, (...[, index]) => index);

describe("shared code and fonts of a project", () => {
  it("draws the text of a custom scene in the project font, with no font code in the scene", async () => {
    const [withFont] = await picturesOf({
      folder: await titleProject({ withFont: true }),
      frames: [20],
    });
    const [withoutFont] = await picturesOf({
      folder: await titleProject({ withFont: false }),
      frames: [20],
    });

    expect(withFont?.equals(withoutFont ?? Buffer.alloc(0))).toBe(false);
  });

  it("gives the same frame after a seek as at the end of a run from frame 0", async () => {
    const folder = await titleProject({ withFont: true });

    const [sought] = await picturesOf({ folder, frames: [20] });
    const run = await picturesOf({ folder, frames: runOfFrames });

    expect(run.at(-1)?.equals(sought ?? Buffer.alloc(0))).toBe(true);
  });

  it("loads the new shared code on a kept page after put of the shared code", async () => {
    const folder = await titleProject({ withFont: true });
    const pictures = createPictureRenderer({ folder });
    const before = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [20] }),
    );
    await changeProject({
      folder,
      edits: [
        { kind: "putSharedCode", name: "theme", code: themeCode("#ff3366") },
      ],
    });
    const after = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [20] }),
    );
    await pictures.close();

    expect(
      Buffer.from(after[0]?.png ?? []).equals(
        Buffer.from(before[0]?.png ?? []),
      ),
    ).toBe(false);
  });
});
