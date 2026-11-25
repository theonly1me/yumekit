import { join } from "node:path";
import { init, result, toolResult, toolUse, whole } from "./claudeLines.js";
import { startChatEngine, type FakeStep } from "./chatEngine.js";

export const roundQuestions = [
  {
    id: "hero",
    text: "Who carries the bell across?",
    options: ["A young ferry hand", "An old bell ringer"],
  },
  {
    id: "ending",
    text: "How does it end?",
    options: ["The boats come home", "The bell rings too late"],
  },
  {
    id: "look",
    text: "Which looks fit?",
    options: ["Painted", "Live film", "Paper cut-out"],
    multiple: true,
  },
];

export function askingSteps(folder: string): FakeStep[] {
  return [
    { print: init },
    { print: whole("A few questions before I write the story.") },
    { print: toolUse({ callId: "ask", tool: "ask_person" }) },
    {
      callTool: {
        name: "ask_person",
        input: { questions: roundQuestions },
        saveResultTo: join(folder, "asked.json"),
      },
    },
    { print: toolResult({ callId: "ask", isError: false }) },
    {
      callTool: {
        name: "get_project",
        input: {},
        saveResultTo: join(folder, "after.json"),
      },
    },
    { print: result("completed") },
  ];
}

export const answeringSteps: FakeStep[] = [
  { print: init },
  { print: whole("Thanks. I write the story now.") },
  { print: result("completed") },
];

export async function startWithOpenRound() {
  const chat = await startChatEngine({ steps: [] });
  const folder = chat.project.root;
  await chat.writeScenario({ steps: askingSteps(folder) });
  await chat.ask({ text: "A film about a bell and the fog." });
  const asked = await chat.waitUntilIdle();
  await chat.writeScenario({ steps: answeringSteps });
  const round = asked.entries.find((entry) => entry.kind === "questions");
  if (round === undefined) throw new Error("The lead asked no questions.");
  return { chat, folder, roundId: round.id };
}

export async function lastRequestTextOf(
  chat: Awaited<ReturnType<typeof startChatEngine>>,
): Promise<string> {
  const runs = await chat.runs();
  return runs.at(-1)?.at(-1) ?? "";
}
