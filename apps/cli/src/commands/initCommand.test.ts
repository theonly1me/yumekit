import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCliWorkspace } from "../testing/runCli.js";

async function readProjectFile(folder: string): Promise<unknown> {
  return JSON.parse(await readFile(join(folder, "project.json"), "utf8"));
}

describe("yumekit init", () => {
  it("makes a project with one 1920 by 1080 output named wide at 30 frames per second by default", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "my-video");

    const run = await workspace.run(["init", folder]);

    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain(
      `Created the project "my-video" in ${folder}.`,
    );
    expect(run.stdout).toContain(`mcp --project ${folder}`);
    expect(await readProjectFile(folder)).toEqual({
      formatVersion: 1,
      name: "my-video",
      framesPerSecond: 30,
      outputs: [
        { id: "wide", label: "wide", widthPixels: 1920, heightPixels: 1080 },
      ],
    });
  });

  it("takes the name, the frame rate, and each output from flags", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "short");

    const run = await workspace.run([
      "init",
      folder,
      "--name",
      "Launch short",
      "--frame-rate",
      "25",
      "--output",
      "tall:1080x1920",
      "--output",
      "square:1080x1080",
    ]);

    expect(run.exitCode).toBe(0);
    expect(await readProjectFile(folder)).toMatchObject({
      name: "Launch short",
      framesPerSecond: 25,
      outputs: [
        { id: "tall", widthPixels: 1080, heightPixels: 1920 },
        { id: "square", widthPixels: 1080, heightPixels: 1080 },
      ],
    });
  });

  it("exits with 2 and the usage for an output flag in the wrong form", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run([
      "init",
      join(workspace.root, "bad"),
      "--output",
      "1080x1920",
    ]);

    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("--output must look like wide:1920x1080");
    expect(run.stderr).toContain("Usage:");
  });

  it("exits with 1 when the folder is not empty", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run(["init", workspace.root]);

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain("is not an empty folder");
  });
});
