import { startChapterPictures } from "./chapterWork.js";
import { firstChat, firstRequest, storyQuestions } from "./chatSeed.js";
import { stopWork } from "./leadWork.js";
import { change, notify, state } from "./state.js";
import { approveStory, resetStory } from "./storySheet.js";
import { seedAdvanced, seedFresh } from "./takesSeed.js";

const thinkMilliseconds = 1700;
export const flow = { phase: "done", timer: undefined };

export function startProject() {
  clearTimeout(flow.timer);
  stopWork();
  seedFresh();
  resetStory();
  flow.phase = "questions";
  const request = state.prompt.trim() === "" ? firstRequest : state.prompt;
  state.chat = [
    { kind: "you", text: request, files: [...state.startFiles] },
    {
      kind: "ai",
      text: "Thanks. Three questions before I write the whole story.",
    },
    ...storyQuestions.map((question) => ({
      kind: "question",
      ...question,
      answer: undefined,
    })),
  ];
  change({
    screen: "project",
    sheet: undefined,
    projectView: undefined,
    prompt: request,
  });
}

export function answerQuestion({ entry, answer }) {
  entry.answer = answer;
  const open = state.chat.filter(
    (candidate) =>
      candidate.kind === "question" && candidate.answer === undefined,
  );
  if (open.length > 0) {
    notify();
    return;
  }
  flow.phase = "writing";
  state.chat.push({
    kind: "ai",
    text: "I write the whole story and the script now.",
  });
  notify();
  flow.timer = setTimeout(() => {
    flow.phase = "story";
    state.chat.push({
      kind: "ai",
      text: "The whole story is ready on the left. Approve it, or click a paragraph to tell me what to change.",
    });
    notify();
  }, thinkMilliseconds);
}

export function approveStoryAndPlan() {
  approveStory();
  flow.phase = "done";
  state.chat.push({
    kind: "ai",
    text: "Thanks. The film is 8 minutes, too long to make at once. I split it into 4 chapters, and I make one chapter at a time:",
    split: [
      "1. The last crossing, 1:50",
      "2. Into the fog, 2:10",
      "3. Snow on Hollin, 2:20",
      "4. The ninth bell, 1:40",
    ],
    after: "I start with the pictures of chapter 1.",
    action: { label: "Change the chapters", go: "chapters" },
  });
  state.projectView = undefined;
  startChapterPictures("c1");
}

export function showSampleProject() {
  clearTimeout(flow.timer);
  stopWork();
  seedAdvanced();
  approveStory();
  flow.phase = "done";
  state.chat = firstChat();
  change({ screen: "project", sheet: undefined, projectView: undefined });
}
