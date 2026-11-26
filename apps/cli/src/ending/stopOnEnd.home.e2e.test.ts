import { describe, expect, it } from "vitest";
import { z } from "zod";
import { join } from "node:path";
import { startHomeWorkspace } from "../testing/homeWorkspace.js";
import {
  browsersPath,
  processesLeftAfter,
  processesStartedBy,
} from "../testing/processTree.js";
import { createCliWorkspace } from "../testing/runCli.js";
import { runOpen } from "../testing/runOpen.js";

const createdSchema = z.object({ url: z.string(), folder: z.string() });

async function callEngineTool(options: {
  url: string;
  name: string;
  input: object;
}): Promise<unknown> {
  const address = new URL(options.url);
  const answer = await fetch(`${address.origin}/api/tools/${options.name}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${address.searchParams.get("token") ?? ""}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ input: options.input }),
  });
  return answer.json();
}

async function drawOnePicture(url: string): Promise<unknown> {
  await callEngineTool({
    url,
    name: "put_scene",
    input: {
      scene_id: "tea",
      title: "Tea",
      kit_component: "title-card",
      props: { heading: "Tea" },
    },
  });
  return callEngineTool({
    url,
    name: "preview_scenes",
    input: { output_id: "wide", scene_ids: ["tea"] },
  });
}

function isBrowser(row: { command: string }): boolean {
  return /chrom|headless_shell/i.test(row.command);
}

describe("the end of the home server", () => {
  it("leaves no process of it 5 seconds after SIGTERM, with an open project and a picture", async () => {
    const { home, send } = await startHomeWorkspace({ withBrowser: true });
    const created = createdSchema.parse(
      (
        await send({
          path: "/api/home/projects",
          body: { request: "Tea", platform_ids: ["youtube"], length: 15 },
        })
      ).value,
    );
    const picture = await drawOnePicture(created.url);
    const started = await processesStartedBy(home.processId);

    await home.stop("SIGTERM");
    const left = await processesLeftAfter({
      processes: started,
      waitMilliseconds: 5000,
    });

    expect(picture).toMatchObject({ isError: false });
    expect(started.some(isBrowser)).toBe(true);
    expect(left).toEqual([]);
  }, 180_000);
});

describe("the end of yumekit open", () => {
  it.each(["SIGINT", "SIGHUP"] as const)(
    "leaves no process of it 5 seconds after %s",
    async (signal) => {
      const workspace = await createCliWorkspace();
      workspace.environment["PLAYWRIGHT_BROWSERS_PATH"] = browsersPath();
      const folder = join(workspace.root, "project");
      await workspace.run(["init", folder]);
      const open = await runOpen({
        folder,
        environment: workspace.environment,
      });
      const picture = await drawOnePicture(open.url);
      const started = await processesStartedBy(open.processId);

      await open.stop(signal);
      const left = await processesLeftAfter({
        processes: started,
        waitMilliseconds: 5000,
      });

      expect(picture).toMatchObject({ isError: false });
      expect(started.some(isBrowser)).toBe(true);
      expect(left).toEqual([]);
    },
    180_000,
  );
});
