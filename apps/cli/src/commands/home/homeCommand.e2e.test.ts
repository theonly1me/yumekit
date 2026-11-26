import { readFile, realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startHomeWorkspace } from "../../testing/homeWorkspace.js";
import { runOpen } from "../../testing/runOpen.js";

const createdSchema = z.object({ url: z.string(), folder: z.string() });

async function isPresent(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

async function idleChat(url: string) {
  const address = new URL(url);
  const headers = {
    authorization: `Bearer ${address.searchParams.get("token") ?? ""}`,
  };
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const answer = await fetch(`${address.origin}/api/chat`, { headers });
    const chat = z
      .object({ state: z.string(), entries: z.array(z.looseObject({})) })
      .parse(await answer.json());
    if (chat.state === "idle") return chat;
    await delay(50);
  }
  throw new Error("The first request did not end.");
}

describe("yumekit with no command", () => {
  it("serves the start page and says that it is the home server", async () => {
    const { home, send } = await startHomeWorkspace();

    const page = await fetch(home.url);
    const health = await send({ path: "/api/health" });

    expect(home.output()).toContain("yumekit runs at:");
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('<div id="root">');
    expect(health.value).toMatchObject({ name: "yumekit", server: "home" });
  });

  it("makes the project, opens its engine, and runs the first request through the bridge", async () => {
    const { projectsFolder, send } = await startHomeWorkspace();

    const answer = await send({
      path: "/api/home/projects",
      body: {
        request: "A video about tea.",
        platform_ids: ["youtube", "tiktok"],
        length: 30,
      },
    });
    const created = createdSchema.parse(answer.value);
    const chat = await idleChat(created.url);
    const script = await readFile(join(created.folder, "script.md"), "utf8");

    expect(created.folder).toBe(
      join(await realpath(projectsFolder), "a-video-about-tea"),
    );
    expect(chat.entries).toEqual([
      expect.objectContaining({ kind: "request" }),
      expect.objectContaining({ kind: "answer", state: "done" }),
      expect.objectContaining({ kind: "change", undoSteps: 1 }),
    ]);
    expect(script).toBe("ready");
  }, 120_000);

  it("lists a project that yumekit open opened, and opens it in the engine of that command", async () => {
    const { workspace, send } = await startHomeWorkspace();
    const folder = join(workspace.root, "own-project");
    await workspace.run(["init", folder]);
    const open = await runOpen({ folder, environment: workspace.environment });

    const home = z
      .object({ recent: z.array(z.object({ folder: z.string() })) })
      .parse((await send({ path: "/api/home" })).value);
    const opened = await send({
      path: "/api/home/open",
      body: { folder: await realpath(folder) },
    });

    expect(home.recent.map((project) => project.folder)).toEqual([
      await realpath(folder),
    ]);
    expect(opened.value).toEqual({ url: open.url });
  });

  it("stops each engine that it started on SIGTERM, and each engine removes engine.json", async () => {
    const { home, send } = await startHomeWorkspace();
    const created = createdSchema.parse(
      (
        await send({
          path: "/api/home/projects",
          body: { request: "Tea", platform_ids: ["square"], length: 15 },
        })
      ).value,
    );
    const engineFile = join(created.folder, ".yumekit", "engine.json");
    const wasPresent = await isPresent(engineFile);
    await idleChat(created.url);

    const exitCode = await home.stop();

    expect(wasPresent).toBe(true);
    expect(exitCode).toBe(0);
    expect(home.output()).toContain("yumekit: stopped.");
    expect(await isPresent(engineFile)).toBe(false);
  }, 120_000);
});
