import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cutQuenchClip,
  dressStoryProject,
} from "../../testing/designProject.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";
import { buildStoryProject } from "../../testing/storyProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await buildStoryProject(engine);
  await dressStoryProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function shotRows(): Promise<string[]> {
  const { page, close } = await openEditor(runningEngine().url);
  await openStepSheet({ page, name: "Story" });
  const sheet = page.getByRole("dialog", { name: "The story" });
  await expect.poll(() => sheet.locator(".shot-design").count()).toBe(2);
  const rows = await sheet.locator(".shot-row .shot-text").allInnerTexts();
  await close();
  return rows;
}

describe("the design of each shot", () => {
  it("marks a shot whose design holds, and a shot whose start picture changes the design", async () => {
    const rows = await shotRows();

    expect(rows[0]).toContain("Same design all through.");
    expect(rows[1]).toContain("The design changes, so this cannot be used.");
    expect(rows[1]).toContain(
      "Aiko: A long leather apron over a sleeveless grey tunic. Seen: The apron now has long sleeves",
    );
  });

  it("marks a clip that changes partway with the time where it is cut", async () => {
    await cutQuenchClip(runningEngine());

    const rows = await shotRows();

    expect(rows[1]).toContain(
      "Same design until 1.75 seconds, then it changes. Only that part is used.",
    );
  });

  it("shows the look of a person in the Cast view, with what it wears and carries", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.getByRole("button", { name: "Cast", exact: true }).click();
    const looks = page.getByRole("list", { name: "Looks of Aiko" });

    const wears = looks.getByRole("list", { name: "Wears" });
    const carries = looks.getByRole("list", { name: "Carries" });

    await expect
      .poll(() => wears.innerText())
      .toBe("A long leather apron over a sleeveless grey tunic");
    expect(await carries.innerText()).toBe("1 hammer, in her right hand");
    expect(await looks.innerText()).toContain("The design");
    await close();
  });
});
