import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { createProject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { recordRecentProject } from "./recentProjects.js";
import { startTestHome } from "./testing/homeFixture.js";

const homeSchema = z.object({
  recent: z.array(z.looseObject({ folder: z.string() })),
  agents: z.array(z.looseObject({ id: z.string(), in_use: z.boolean() })),
  projects_folder: z.string(),
});

const createdSchema = z.object({ url: z.string(), folder: z.string() });

async function makeProject(options: { root: string; name: string }) {
  const folder = join(options.root, options.name);
  const created = await createProject({
    folder,
    name: options.name,
    framesPerSecond: 30,
    outputs: [
      { id: "wide", label: "Wide", widthPixels: 320, heightPixels: 180 },
    ],
  });
  if (!created.ok) throw new Error(created.failure.message);
  return folder;
}

describe("the recent projects of the home server", () => {
  it("lists a new project with its platforms and length, and opens it in the engine that runs", async () => {
    const test = await startTestHome({ agent: "none" });
    const created = createdSchema.parse(
      JSON.parse(
        (
          await test.send({
            path: "/api/home/projects",
            body: { request: "Tea", platform_ids: ["x", "tiktok"], length: 60 },
          })
        ).body,
      ),
    );

    const home = homeSchema.parse(
      JSON.parse((await test.send({ path: "/api/home" })).body),
    );
    const opened = await test.send({
      path: "/api/home/open",
      body: { folder: created.folder },
    });

    expect(home.recent).toEqual([
      expect.objectContaining({
        folder: created.folder,
        name: "Tea",
        platforms: ["tiktok", "x"],
        length: 60,
      }),
    ]);
    expect(home.projects_folder).toBe(test.projectsFolder);
    expect(home.agents.map((agent) => agent.id)).toEqual([
      "claude-code",
      "codex",
      "cursor",
    ]);
    expect(opened.status).toBe(200);
    expect(JSON.parse(opened.body)).toEqual({
      url: created.url.replace(/&first-request=.*$/, ""),
    });
  });

  it("names the AI in use from the settings", async () => {
    const test = await startTestHome({ agent: { steps: [] } });

    const home = homeSchema.parse(
      JSON.parse((await test.send({ path: "/api/home" })).body),
    );

    expect(home.agents).toEqual([
      expect.objectContaining({
        id: "claude-code",
        in_use: true,
        sign_in: "signed-in",
      }),
      expect.objectContaining({ id: "codex", in_use: false }),
      expect.objectContaining({ id: "cursor", in_use: false }),
    ]);
  });

  it("keeps the 20 newest projects and leaves out a folder that no longer exists", async () => {
    const test = await startTestHome({ agent: "none" });
    const root = join(test.root, "made");
    await mkdir(root);
    const names = Array.from(
      { length: 21 },
      (...[, index]) => `p${String(index)}`,
    );
    for (const name of names) {
      await recordRecentProject({ folder: await makeProject({ root, name }) });
    }
    await rm(join(root, "p20"), { recursive: true });

    const home = homeSchema.parse(
      JSON.parse((await test.send({ path: "/api/home" })).body),
    );
    const file = z
      .object({ projects: z.array(z.object({ folder: z.string() })) })
      .parse(
        JSON.parse(
          await readFile(
            join(test.configurationDirectory, "recent.json"),
            "utf8",
          ),
        ),
      );

    expect(file.projects).toHaveLength(20);
    expect(home.recent.map((project) => project.folder)).toEqual(
      names
        .slice(1, 20)
        .reverse()
        .map((name) => join(root, name)),
    );
  });
});
