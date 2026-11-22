import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { openProject, type PlatformId } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { createCliWorkspace, type CliWorkspace } from "../testing/runCli.js";

const runFile = promisify(execFile);

async function createTitleProject(options: {
  workspace: CliWorkspace;
  platforms?: PlatformId[];
}): Promise<string> {
  const { workspace, platforms = [] } = options;
  const folder = join(workspace.root, "project");
  const size = platforms.length === 0 ? "640x360" : "1920x1080";
  await workspace.run(["init", folder, "--output", `wide:${size}`]);
  const opened = await openProject({ folder });
  if (!opened.ok) throw new Error(opened.failure.message);
  const applied = await opened.value.applyEdits([
    ...(platforms.length === 0
      ? []
      : [
          {
            kind: "setOutputPlatforms" as const,
            outputId: "wide",
            platforms,
          },
        ]),
    {
      kind: "putScene",
      scene: {
        id: "intro",
        title: "Intro",
        notes: "",
        source: {
          kind: "kit",
          component: "title-card",
          props: { heading: "From the command line" },
        },
      },
    },
    {
      kind: "setTimeline",
      timeline: {
        outputId: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "intro",
                sceneId: "intro",
                startFrame: 0,
                durationFrames: 30,
                sceneStartFrame: 0,
              },
            ],
          },
        ],
      },
    },
  ]);
  if (!applied.ok) throw new Error(applied.failure.message);
  return folder;
}

describe("yumekit render and yumekit frame", () => {
  it("render writes renders/<id>.mp4 with the frame range and scale asked", async () => {
    const workspace = await createCliWorkspace({ home: "user" });
    const folder = await createTitleProject({ workspace });

    const run = await workspace.run([
      "render",
      "--project",
      folder,
      "--output",
      "wide",
      "--scale",
      "0.25",
      "--first-frame",
      "5",
      "--frame-count",
      "12",
    ]);

    const file = join(folder, "renders", "wide.mp4");
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toBe(`${file}\n`);
    expect(run.stderr).toContain("Rendered 12 of 12 frames");
    const { stdout } = await runFile("ffprobe", [
      "-v",
      "error",
      "-count_frames",
      "-show_entries",
      "stream=width,height,nb_read_frames",
      "-of",
      "csv=p=0",
      file,
    ]);
    expect(stdout.trim()).toBe("160,90,12");
  }, 120_000);

  it("render writes one file for each platform of the output and prints each file", async () => {
    const workspace = await createCliWorkspace({ home: "user" });
    const folder = await createTitleProject({
      workspace,
      platforms: ["youtube", "linkedin"],
    });

    const run = await workspace.run([
      "render",
      "--project",
      folder,
      "--output",
      "wide",
      "--scale",
      "0.25",
      "--frame-count",
      "3",
    ]);

    const youtube = join(folder, "renders", "project-youtube.mp4");
    const linkedin = join(folder, "renders", "project-linkedin.mp4");
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toBe(`${youtube}\n${linkedin}\n`);
    expect(await readFile(linkedin)).toEqual(await readFile(youtube));
  }, 120_000);

  it("frame writes renders/<id>-frame-<n>.png at the scale asked", async () => {
    const workspace = await createCliWorkspace({ home: "user" });
    const folder = await createTitleProject({ workspace });

    const run = await workspace.run([
      "frame",
      "--project",
      folder,
      "--output",
      "wide",
      "--frame",
      "20",
      "--scale",
      "0.5",
    ]);

    const file = join(folder, "renders", "wide-frame-20.png");
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toBe(`${file}\n`);
    const png = await readFile(file);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([320, 180]);
  }, 120_000);

  it("render gives the failure and its hint for an unknown output", async () => {
    const workspace = await createCliWorkspace({ home: "user" });
    const folder = await createTitleProject({ workspace });

    const run = await workspace.run([
      "render",
      "--project",
      folder,
      "--output",
      "tall",
    ]);

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain("tall");
  }, 120_000);
});
