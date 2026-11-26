import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { exportNameOf, placeExport } from "./exportFiles.js";
import { revealCommandOf } from "./revealFile.js";

async function projectWithRender(content: string) {
  const projectFolder = await mkdtemp(join(tmpdir(), "yumekit-exports-"));
  onTestFinished(() => rm(projectFolder, { recursive: true, force: true }));
  await mkdir(join(projectFolder, "renders"));
  const renderFile = join(projectFolder, "renders", "trailer-youtube.mp4");
  await writeFile(renderFile, content);
  return { projectFolder, renderFile };
}

describe("the files of an export", () => {
  it("keeps an earlier export and gives the next one a number", async () => {
    const { projectFolder, renderFile } = await projectWithRender("first");
    const first = await placeExport({
      projectFolder,
      renderFile,
      name: "trailer-youtube.mp4",
    });
    await writeFile(renderFile, "second cut");
    const second = await placeExport({
      projectFolder,
      renderFile,
      name: "trailer-youtube.mp4",
    });

    if (!first.ok || !second.ok) throw new Error("An export was not placed");
    expect(first.value.path).toBe(
      join(projectFolder, "exports", "trailer-youtube.mp4"),
    );
    expect(second.value.path).toBe(
      join(projectFolder, "exports", "trailer-youtube-2.mp4"),
    );
    expect(await readFile(first.value.path, "utf8")).toBe("first");
    expect(second.value.bytes).toBe("second cut".length);
  });

  it("names a file after the project and the platform, or the output when it has no platform", () => {
    expect(
      exportNameOf({
        renderFile: "/p/renders/yumekit-trailer-youtube.mp4",
        projectName: "yumekit trailer",
        platformId: "youtube",
      }),
    ).toBe("yumekit-trailer-youtube.mp4");
    expect(
      exportNameOf({
        renderFile: "/p/renders/wide-under-10mb.mp4",
        projectName: "yumekit trailer",
        platformId: undefined,
      }),
    ).toBe("yumekit-trailer-wide-under-10mb.mp4");
  });

  it("asks the program of each system to show the file", () => {
    const file = "/films/trailer/exports/trailer-youtube.mp4";

    expect(revealCommandOf({ platform: "darwin", file })).toMatchObject({
      program: "open",
      arguments: ["-R", file],
    });
    expect(revealCommandOf({ platform: "linux", file })).toMatchObject({
      program: "xdg-open",
      arguments: ["/films/trailer/exports"],
    });
    expect(
      revealCommandOf({ platform: "win32", file: "C:\\films\\a b.mp4" }),
    ).toMatchObject({
      program: "explorer.exe",
      arguments: ['/select,"C:\\films\\a b.mp4"'],
      countsAnyExit: true,
    });
  });
});
