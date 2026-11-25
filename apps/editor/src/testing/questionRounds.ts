import { claudeLines, type FakeStep } from "./fakeAgent.js";

export const storyQuestions = [
  {
    id: "hero",
    text: "Who carries the bell across?",
    options: ["A young ferry hand", "An old bell ringer", "Two strangers"],
  },
  {
    id: "ending",
    text: "How does it end?",
    options: [
      "The fog lifts and the boats come home",
      "The bell rings, but too late",
      "Leave it open",
    ],
  },
  {
    id: "helper",
    text: "Does anyone help her on the way?",
    options: ["No, she is alone", "A stranger she saves", "Her grandfather"],
  },
];

export const lookQuestions = [
  {
    id: "length",
    text: "How long should the film be?",
    options: ["About 8 minutes", "About 3 minutes", "A 60 second trailer"],
  },
  {
    id: "look",
    text: "Which looks fit best?",
    options: ["Painted, cold light", "Like a live film", "Paper cut-out"],
    multiple: true,
  },
];

export function askingSteps(options: {
  say: string;
  questions: object[];
}): FakeStep[] {
  return [
    { print: claudeLines.init },
    { print: claudeLines.whole(options.say) },
    { print: claudeLines.toolUse({ callId: "ask", tool: "ask_person" }) },
    {
      callTool: {
        name: "ask_person",
        input: { questions: options.questions },
      },
    },
    { print: claudeLines.toolResult("ask") },
    { print: claudeLines.result("completed") },
  ];
}

export const thanksSteps: FakeStep[] = [
  { print: claudeLines.init },
  { print: claudeLines.whole("Thanks. I write the whole story now.") },
  { print: claudeLines.result("completed") },
];
