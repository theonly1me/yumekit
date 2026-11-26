import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  init,
  result,
  toolResult,
  toolUse,
  whole,
} from "../chat/testing/claudeLines.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { startTestHome } from "./testing/homeFixture.js";

const createdSchema = z.object({
  url: z.string(),
  folder: z.string(),
  first_request: z.looseObject({ started: z.boolean() }),
});

const scriptScenario = {
  steps: [
    { print: init },
    { print: toolUse({ callId: "call-1", tool: "set_script" }) },
    { callTool: { name: "set_script", input: { script: "Tea." } } },
    { print: toolResult({ callId: "call-1", isError: false }) },
    { print: whole("The script is ready.") },
    { print: result("completed") },
  ],
};

async function isPresent(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

async function idleChat(options: { url: string }) {
  const address = new URL(options.url);
  const token = address.searchParams.get("token") ?? "";
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const answer = await rawRequest({
      port: Number(address.port),
      path: "/api/chat",
      headers: withToken({ token }),
    });
    const chat = z
      .object({ state: z.string(), entries: z.array(z.looseObject({})) })
      .parse(JSON.parse(answer.body));
    if (chat.state === "idle") return chat;
    await delay(50);
  }
  throw new Error("The first request did not end.");
}

describe("a new project from the home server", () => {
  it("makes the folder with one output for each size, opens an engine, and sends the first request", async () => {
    const test = await startTestHome({ agent: scriptScenario });

    const answer = await test.send({
      path: "/api/home/projects",
      body: {
        request: "A 15 second video about green tea.\nWarm and calm.",
        platform_ids: ["tiktok", "youtube", "youtube-shorts"],
        length: 15,
      },
    });
    const created = createdSchema.parse(JSON.parse(answer.body));
    const project: unknown = JSON.parse(
      await readFile(join(created.folder, "project.json"), "utf8"),
    );
    const chat = await idleChat(created);

    expect(created.folder).toBe(
      join(test.projectsFolder, "a-15-second-video-about-green"),
    );
    expect(created.url).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/\?token=[0-9a-f]{64}$/,
    );
    expect(project).toMatchObject({
      name: "A 15 second video about green",
      outputs: [
        {
          id: "wide",
          widthPixels: 1920,
          heightPixels: 1080,
          platforms: ["youtube"],
        },
        {
          id: "tall",
          widthPixels: 1080,
          heightPixels: 1920,
          platforms: ["youtube-shorts", "tiktok"],
        },
      ],
    });
    expect(chat.entries[0]).toMatchObject({
      kind: "request",
      text: "A 15 second video about green tea.\nWarm and calm.",
      details:
        "Platforms: YouTube, YouTube Shorts, TikTok.\nLength: 15 seconds.\nBetween scenes: a fade from each scene to the next.",
    });
    expect(chat.entries[1]).toMatchObject({ kind: "answer", state: "done" });
  });

  it("adds no wide output when YouTube is not chosen, and numbers a folder name that is taken", async () => {
    const test = await startTestHome({ agent: scriptScenario });
    const body = {
      request: "Tea",
      platform_ids: ["instagram-reel"],
      length: "auto",
    };

    const first = createdSchema.parse(
      JSON.parse((await test.send({ path: "/api/home/projects", body })).body),
    );
    const second = createdSchema.parse(
      JSON.parse((await test.send({ path: "/api/home/projects", body })).body),
    );
    const project: unknown = JSON.parse(
      await readFile(join(second.folder, "project.json"), "utf8"),
    );

    expect([first.folder, second.folder]).toEqual([
      join(test.projectsFolder, "tea"),
      join(test.projectsFolder, "tea-2"),
    ]);
    expect(project).toMatchObject({
      outputs: [{ id: "tall", platforms: ["instagram-reel"] }],
    });
    expect(
      z.object({ outputs: z.array(z.unknown()) }).parse(project).outputs,
    ).toHaveLength(1);
  });

  it("still makes and opens the project when no AI program is on the computer, and names the failure", async () => {
    const test = await startTestHome({ agent: "none" });

    const answer = await test.send({
      path: "/api/home/projects",
      body: { request: "Tea", platform_ids: ["youtube"], length: 30 },
    });
    const created = createdSchema.parse(JSON.parse(answer.body));

    expect(answer.status).toBe(200);
    expect(created.first_request).toMatchObject({
      started: false,
      kind: "no-agent",
    });
    expect(created.url).toMatch(/&first-request=no-agent$/);
    expect(
      await isPresent(join(created.folder, ".yumekit", "engine.json")),
    ).toBe(true);
  });

  it("stops each engine that it started when it closes, and each engine removes engine.json", async () => {
    const test = await startTestHome({ agent: "none" });
    const folders = await Promise.all(
      ["Tea", "Coffee"].map(async (request) => {
        const answer = await test.send({
          path: "/api/home/projects",
          body: { request, platform_ids: ["square"], length: 60 },
        });
        return createdSchema.parse(JSON.parse(answer.body)).folder;
      }),
    );

    await test.home.close();

    expect(
      await Promise.all(
        folders.map((folder) =>
          isPresent(join(folder, ".yumekit", "engine.json")),
        ),
      ),
    ).toEqual([false, false]);
  });
});
