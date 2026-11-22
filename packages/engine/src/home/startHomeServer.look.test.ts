import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { init, result, whole } from "../chat/testing/claudeLines.js";
import { startTestHome } from "./testing/homeFixture.js";

const quietScenario = {
  steps: [
    { print: init },
    { print: whole("Done.") },
    { print: result("completed") },
  ],
};

const createdSchema = z.object({ folder: z.string() });
const projectSchema = z.looseObject({ look: z.string().optional() });

async function lookOfNewProject(body: object): Promise<string | undefined> {
  const test = await startTestHome({ agent: quietScenario });
  const answer = await test.send({
    path: "/api/home/projects",
    body: { request: "Tea", platform_ids: ["tiktok"], length: 15, ...body },
  });
  const { folder } = createdSchema.parse(JSON.parse(answer.body));
  return projectSchema.parse(
    JSON.parse(await readFile(join(folder, "project.json"), "utf8")),
  ).look;
}

describe("the look of a new project from the home server", () => {
  it("gives a new project the midnight look when the start screen sends none", async () => {
    expect(await lookOfNewProject({})).toBe("midnight");
  });

  it("gives a new project the look that the person picked", async () => {
    expect(await lookOfNewProject({ look: "editorial" })).toBe("editorial");
  });

  it("refuses a look that yumekit does not have", async () => {
    const test = await startTestHome({ agent: quietScenario });

    const answer = await test.send({
      path: "/api/home/projects",
      body: {
        request: "Tea",
        platform_ids: ["tiktok"],
        length: 15,
        look: "sepia",
      },
    });

    expect(answer.status).toBe(400);
  });
});
