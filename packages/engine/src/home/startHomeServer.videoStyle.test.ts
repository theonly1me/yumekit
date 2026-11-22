import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { init, result, whole } from "../chat/testing/claudeLines.js";
import { startTestHome } from "./testing/homeFixture.js";

const createdSchema = z.object({ folder: z.string() });

const savedProjectSchema = z.object({
  data: z.object({ video_style: z.string() }),
});

async function savedResult(file: string): Promise<string> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const text = await readFile(file, "utf8").catch(() => undefined);
    if (text !== undefined && text !== "") return text;
    await delay(50);
  }
  throw new Error("The fake agent saved no result.");
}

async function startHomeThatReadsTheProject() {
  const test = await startTestHome({ agent: { steps: [] } });
  const resultFile = join(test.root, "get-project.json");
  await test.agent?.writeScenario({
    steps: [
      { print: init },
      {
        callTool: {
          name: "get_project",
          input: {},
          saveResultTo: resultFile,
        },
      },
      { print: whole("I read the project.") },
      { print: result("completed") },
    ],
  });
  return { test, resultFile };
}

describe("the video style of a new project from the home server", () => {
  it.each(["graphics", "ai-video", "mix"])(
    "gives the style %s to the AI in its first request through get_project",
    async (videoStyle) => {
      const { test, resultFile } = await startHomeThatReadsTheProject();

      const answer = await test.send({
        path: "/api/home/projects",
        body: {
          request: "Tea",
          platform_ids: ["youtube"],
          length: 15,
          video_style: videoStyle,
        },
      });
      const created = createdSchema.parse(JSON.parse(answer.body));
      const read = savedProjectSchema.parse(
        JSON.parse(await savedResult(resultFile)),
      );
      const project: unknown = JSON.parse(
        await readFile(join(created.folder, "project.json"), "utf8"),
      );

      expect(read.data.video_style).toBe(videoStyle);
      expect(project).toMatchObject({ videoStyle });
    },
  );

  it("makes a graphics project when the request names no style", async () => {
    const { test, resultFile } = await startHomeThatReadsTheProject();

    await test.send({
      path: "/api/home/projects",
      body: { request: "Tea", platform_ids: ["youtube"], length: 15 },
    });
    const read = savedProjectSchema.parse(
      JSON.parse(await savedResult(resultFile)),
    );

    expect(read.data.video_style).toBe("graphics");
  });

  it("refuses a style that is not in the list", async () => {
    const test = await startTestHome({ agent: "none" });

    const answer = await test.send({
      path: "/api/home/projects",
      body: {
        request: "Tea",
        platform_ids: ["youtube"],
        length: 15,
        video_style: "cartoon",
      },
    });

    expect(answer.status).toBe(400);
  });

  it("gives the limit of AI video of the user file, and 30 seconds with no file", async () => {
    const test = await startTestHome({ agent: "none" });
    const homeSchema = z.object({
      generated_video_limit_seconds: z.number().nullable(),
    });

    const before = homeSchema.parse(
      JSON.parse((await test.send({ path: "/api/home" })).body),
    );
    await writeFile(
      join(test.configurationDirectory, "media-tools.json"),
      JSON.stringify({ limits: { generatedVideoSeconds: 12 } }),
    );
    const after = homeSchema.parse(
      JSON.parse((await test.send({ path: "/api/home" })).body),
    );

    expect(before.generated_video_limit_seconds).toBe(30);
    expect(after.generated_video_limit_seconds).toBe(12);
  });
});
