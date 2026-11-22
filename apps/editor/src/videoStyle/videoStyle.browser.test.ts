import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  chatOf,
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { engineRequest, openTools } from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function videoStyleOfProject(): Promise<string | undefined> {
  const snapshot = z
    .object({ project: z.object({ videoStyle: z.string().optional() }) })
    .parse(
      await engineRequest({ engine: runningEngine(), path: "/api/project" }),
    );
  return snapshot.project.videoStyle;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
  await engine.callTool({
    name: "put_scene",
    input: {
      scene_id: "clip",
      title: "Real shot",
      kit_component: "video-clip",
      props: { assetId: "no-video-yet" },
    },
  });
  for (const outputId of ["wide", "tall"]) {
    await engine.callTool({
      name: "update_clip",
      input: { output_id: outputId, clip_id: "second", scene_id: "clip" },
    });
  }
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("Done.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the video style in the editor", () => {
  it("changes the style of the project from Settings, and shows the new choice", async () => {
    const editor = await openEditor(runningEngine().url);
    await openTools(editor.page);
    const choices = editor.page
      .getByRole("dialog", { name: "Settings" })
      .getByRole("group", { name: "How the video is made" });
    const pressed = () =>
      choices.locator('[aria-pressed="true"] .style-choice-name').innerText();
    await expect.poll(pressed).toBe("Graphics");

    await choices.getByRole("button", { name: /^AI video/ }).click();

    await expect.poll(() => videoStyleOfProject()).toBe("ai-video");
    await expect.poll(pressed).toBe("AI video");
    await choices.getByRole("button", { name: /^Graphics/ }).click();
    await expect.poll(() => videoStyleOfProject()).toBe("graphics");
    await editor.close();
  });

  it("labels each scene card Graphics or Video clip", async () => {
    const editor = await openEditor(runningEngine().url);
    const labels = editor.page.locator(".card .card-style");

    await expect
      .poll(() => labels.allInnerTexts())
      .toEqual(["Graphics", "Video clip"]);
    await editor.close();
  });

  it("asks the AI to draw a scene with a clip by code again, about that scene", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    const actions = editor.page.getByRole("group", {
      name: /^Actions for scene/,
    });
    await editor.page.locator(".card", { hasText: "First counter" }).click();
    expect(
      await actions.getByRole("button", { name: "Back to graphics" }).count(),
    ).toBe(0);

    await editor.page.locator(".card", { hasText: "Real shot" }).click();
    await actions.getByRole("button", { name: "Back to graphics" }).click();

    const expected = "Draw this scene by code, with no video clip.";
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(expected);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Real shot");
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([`You\nAbout scene 2: Real shot\n${expected}`, "AI\nDone."]);
    await editor.close();
  });
});
