import { realpath, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  startedTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import {
  callTool,
  rawRequest,
  titleScene,
  withToken,
} from "../testing/rawRequest.js";
import { startWithReadyTake } from "../testing/readyTake.js";

const chatSchema = z.object({
  entries: z.array(z.looseObject({ kind: z.string() })),
});

const exportEntrySchema = z.object({
  kind: z.literal("export"),
  by: z.string(),
  state: z.string(),
  jobs: z.array(
    z.object({
      state: z.string(),
      files: z.array(z.object({ path: z.string(), bytes: z.number() })),
    }),
  ),
});

function post(options: {
  engine: TestEngine;
  path: string;
  body: object;
  headers?: Record<string, string> | undefined;
}) {
  return rawRequest({
    port: options.engine.port,
    path: options.path,
    method: "POST",
    headers: withToken({
      token: options.engine.token,
      headers: { "content-type": "application/json", ...options.headers },
    }),
    body: JSON.stringify(options.body),
  });
}

async function readyCut(engine: TestEngine): Promise<void> {
  const calls: { name: string; input: object }[] = [
    { name: "put_scene", input: titleScene },
    {
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 6,
              },
            ],
          },
        ],
      },
    },
    { name: "open_take", input: { step: "cut" } },
    { name: "render_video", input: { output_id: "wide", chapter_id: "film" } },
    {
      name: "ready_take",
      input: {
        items: [
          { id: "cut", note: "The cut.", what_to_check: "Watch it once." },
        ],
      },
    },
  ];
  for (const call of calls) {
    const answer = await callTool({ ...engine, ...call });
    expect(answer.body).not.toContain('"isError":true');
  }
}

async function finishedExportOf(engine: TestEngine) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const answer = await rawRequest({
      port: engine.port,
      path: "/api/chat",
      headers: withToken(engine),
    });
    const entry = chatSchema
      .parse(JSON.parse(answer.body))
      .entries.findLast((each) => each.kind === "export");
    const parsed = exportEntrySchema.safeParse(entry);
    if (parsed.success && parsed.data.state !== "running") return parsed.data;
    await delay(100);
  }
  throw new Error("The export did not finish.");
}

describe("the export routes", { timeout: 180_000 }, () => {
  it("refuses to send a take that a newer take replaced", async () => {
    const chat = await startWithReadyTake();
    await callTool({
      ...chat.engine,
      name: "open_take",
      input: { step: "clips" },
    });

    const sent = await chat.post({ path: "/api/takes/take-1/send" });

    expect(sent.status).toBe(409);
    expect(JSON.parse(sent.body)).toEqual({
      kind: "take-replaced",
      message:
        "Take 2 of the clips replaced take 1 of the pictures, so it cannot be sent. Review take 2.",
    });
  });

  it("reveals only a file inside the project, and only for the person", async () => {
    const { engine, projectFolder, root } = await startedTestEngine();
    const secret = join(root, "secret.mp4");
    await writeFile(secret, "not of the project");
    const reveal = (asked: {
      path: string;
      headers?: Record<string, string>;
    }) =>
      post({
        engine,
        path: "/api/exports/reveal",
        body: { path: asked.path },
        headers: asked.headers,
      });

    const outside = await reveal({
      path: join(projectFolder, "..", "secret.mp4"),
    });
    const missing = await reveal({
      path: join(projectFolder, "exports", "none.mp4"),
    });
    const byAi = await reveal({
      path: join(projectFolder, "project.json"),
      headers: { "x-yumekit-client": "agent" },
    });

    expect([outside.status, missing.status, byAi.status]).toEqual([
      403, 404, 403,
    ]);
    expect(JSON.parse(outside.body)).toMatchObject({
      kind: "file-outside-project",
    });
    expect(JSON.parse(byAi.body)).toMatchObject({
      kind: "export-not-for-the-ai",
    });
  });

  it("exports the film to the exports folder when the person approves the last cut", async () => {
    const { engine, projectFolder } = await startedTestEngine();
    await readyCut(engine);

    const sent = await post({
      engine,
      path: "/api/takes/take-1/send",
      body: { next: "stop" },
    });
    const exported = await finishedExportOf(engine);

    expect(sent.status).toBe(202);
    expect(exported.by).toBe("approval");
    expect(exported.state).toBe("done");
    const [file] = exported.jobs.flatMap((job) => job.files);
    const expected = join(
      await realpath(projectFolder),
      "exports",
      "engine-test-wide.mp4",
    );
    expect(file?.path).toBe(expected);
    expect((await stat(expected)).size).toBe(file?.bytes);
  });
});
