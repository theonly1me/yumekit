import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { buildCounterProject } from "../../testing/counterProject.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import {
  askingSteps,
  storyQuestions,
  thanksSteps,
} from "../../testing/questionRounds.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function cardOf(page: Page) {
  const card = page.getByRole("region", { name: "Questions from the AI" });
  return {
    card,
    count: card.locator(".question-count"),
    option: (name: string) => card.getByRole("button", { name, exact: true }),
    ownWords: card.getByRole("textbox", { name: "Your own answer" }),
    button: (name: string) => card.getByRole("button", { name, exact: true }),
  };
}

async function askAndWaitForCard(page: Page) {
  await setScenario({
    engine: runningEngine(),
    scenario: {
      steps: askingSteps({
        say: "A few questions before I write the story.",
        questions: storyQuestions,
      }),
    },
  });
  await chatOf(page).ask("A film about a bell and the winter fog.");
  const round = cardOf(page);
  await expect.poll(() => round.count.textContent()).toBe("Question 1 of 3");
  await setScenario({
    engine: runningEngine(),
    scenario: { steps: thanksSteps },
  });
  return round;
}

describe("questions in rounds", () => {
  it("moves Back and Next on one card, keeps each answer, and folds the sent answers into one line", async () => {
    const editor = await openEditor(runningEngine().url);
    const round = await askAndWaitForCard(editor.page);

    await round.option("A young ferry hand").click();
    await round.button("Next").click();
    await round.ownWords.fill("The fog lifts at dawn.");
    await round.button("Next").click();
    expect(await round.count.textContent()).toBe("Question 3 of 3");
    expect(await round.button("Send my answers").isDisabled()).toBe(true);
    await round.button("Back").click();
    expect(await round.ownWords.inputValue()).toBe("The fog lifts at dawn.");
    await round.button("Back").click();
    expect(
      await round.option("A young ferry hand").getAttribute("aria-pressed"),
    ).toBe("true");
    await round.button("Next").click();
    await round.button("Next").click();
    await round.option("Her grandfather").click();
    await round.button("Send my answers").click();

    const folded = editor.page.locator(".answered-round summary");
    await expect
      .poll(() => folded.textContent())
      .toBe("You answered 3 questions");
    expect(await round.card.count()).toBe(0);
    await folded.click();
    expect(
      await editor.page.locator(".answer-list li").allInnerTexts(),
    ).toEqual([
      "Who carries the bell across?\nA young ferry hand",
      "How does it end?\nThe fog lifts at dawn.",
      "Does anyone help her on the way?\nHer grandfather",
    ]);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Answer: In their own words: The fog lifts at dawn.");
    await editor.close();
  });

  it("sends a message of the box with the answers so far, and closes the round", async () => {
    const editor = await openEditor(runningEngine().url);
    const round = await askAndWaitForCard(editor.page);

    await round.option("Two strangers").click();
    await chatOf(editor.page).ask("Keep it under two minutes.");

    const folded = editor.page.locator(".answered-round summary").last();
    await expect
      .poll(() => folded.textContent())
      .toBe("You answered 1 of 3 questions");
    expect(await round.card.count()).toBe(0);
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Keep it under two minutes.");
    expect((await requestTextsSent(runningEngine())).at(-1)).toContain(
      "2. How does it end?\nNo answer.",
    );
    await editor.close();
  });
});
