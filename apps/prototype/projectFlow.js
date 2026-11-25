import { startChapterPictures } from "./chapterWork.js";
import {
  answersEntry,
  firstChat,
  firstRequest,
  questionRounds,
  roundTalk,
} from "./chatSeed.js";
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
      text: "Thanks. A few questions before I write the whole story.",
    },
  ];
  state.questionRound = { round: 0, index: 0, answers: [] };
  state.costWarning = undefined;
  change({
    screen: "project",
    sheet: undefined,
    projectView: undefined,
    prompt: request,
  });
}

function writeStory() {
  flow.phase = "writing";
  state.chat.push({
    kind: "ai",
    text: "I have what I need. I write the whole story and the script now.",
  });
  flow.timer = setTimeout(() => {
    flow.phase = "story";
    state.chat.push({
      kind: "ai",
      text: "The whole story is ready on the left. Approve it, or click a paragraph to tell me what to change.",
    });
    notify();
  }, thinkMilliseconds);
}

export function sendAnswers() {
  const { round, answers } = state.questionRound;
  state.chat.push(answersEntry({ round, answers }));
  state.questionRound = undefined;
  if (round + 1 >= questionRounds.length) {
    writeStory();
    notify();
    return;
  }
  state.thinking = true;
  notify();
  flow.timer = setTimeout(() => {
    state.thinking = false;
    state.chat.push({ kind: "ai", text: roundTalk });
    state.questionRound = { round: round + 1, index: 0, answers: [] };
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
  state.questionRound = undefined;
  state.costWarning = undefined;
  state.chat = firstChat();
  change({ screen: "project", sheet: undefined, projectView: undefined });
}
