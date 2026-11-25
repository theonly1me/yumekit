import { artMarkup } from "./art.js";
import { storyQuestions } from "./chatSeed.js";
import { chapterNumber, progressText, scenesOf } from "./leadWork.js";
import { escapeText, state } from "./state.js";
import { storyChapters } from "./storyText.js";
import { itemsOf, latestTake, total } from "./takesStore.js";

export const run = {
  phase: "questions",
  answers: storyQuestions.map(() => ({ choice: undefined, words: "" })),
  timer: undefined,
};

function questionMarkup([index, question]) {
  const answer = run.answers[index];
  const options = question.options
    .map(
      (option) =>
        `<button type="button" data-answer="${index}" data-option="${escapeText(option)}" aria-pressed="${answer.choice === option}">${escapeText(option)}</button>`,
    )
    .join("");
  return `
    <li class="question">
      <p>${escapeText(question.text)}</p>
      <div class="answer-buttons" role="group" aria-label="${escapeText(question.text)}">${options}</div>
      <input type="text" id="own-words-${index}" data-own-words="${index}" value="${escapeText(answer.words)}" placeholder="Or say it in your own words" aria-label="Your own answer to: ${escapeText(question.text)}" />
    </li>`;
}

function questionsMarkup() {
  const ready = run.answers.every(
    (answer) => answer.choice !== undefined || answer.words.trim() !== "",
  );
  return `
    <p class="fact lead">The lead read your request. Before it writes the story, it asks you three things.</p>
    <ol class="questions-list">${[...storyQuestions.entries()].map(questionMarkup).join("")}</ol>
    <div class="part-actions"><button type="button" class="primary" data-send-answers ${ready ? "" : "disabled"}>Send my answers</button><p class="fact">${ready ? "" : "Answer each question first."}</p></div>`;
}

function lengthText(chapterId) {
  const seconds = total(scenesOf(chapterId).map((scene) => scene.seconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function storyMarkup() {
  const openings = state.chapters
    .map(
      (chapter) =>
        `<li><b>${chapterNumber(chapter.id)}. ${escapeText(chapter.name)}</b><span>${escapeText(storyChapters[chapter.id].story[0])}</span></li>`,
    )
    .join("");
  return `
    <p class="fact lead">The whole story is ready for you. It has ${state.chapters.length} chapters and a script.</p>
    <ol class="making-story">${openings}</ol>
    <div class="part-actions"><button type="button" data-read-story>Read and comment</button><button type="button" class="primary" data-approve-story>Approve the story</button></div>`;
}

function chaptersMarkup() {
  const rows = state.chapters
    .map(
      (chapter) =>
        `<li><span>${chapterNumber(chapter.id)}. ${escapeText(chapter.name)}</span><em>${scenesOf(chapter.id).length} scenes, ${lengthText(chapter.id)}</em></li>`,
    )
    .join("");
  return `
    <p class="fact lead">8 minutes is too long to make at once. The lead split the film into ${state.chapters.length} chapters and planned the shots of each. It makes one chapter at a time.</p>
    <ol class="making-chapters">${rows}</ol>
    <div class="part-actions"><button type="button" data-see-chapters>Change the split in the timeline</button><button type="button" class="primary" data-approve-chapters>Approve the chapters</button></div>`;
}

function picturesMarkup() {
  const take = latestTake("c1");
  if (take === undefined) {
    return "";
  }
  const thumbs = itemsOf(take)
    .map((item) => `<li>${artMarkup(item.picture)}</li>`)
    .join("");
  const ready = take.state !== "making";
  return `
    <p class="fact lead">${ready ? `Take 1 of chapter 1 is ready for you: ${take.planned} pictures.` : `${progressText(take)}. You can open the take now and review what is there.`}</p>
    <ul class="making-thumbs">${thumbs}</ul>
    <div class="part-actions"><button type="button" class="${ready ? "primary" : ""}" data-open-take>Open take 1</button>${ready ? `<button type="button" data-editor>Open the editor</button>` : ""}</div>`;
}

const panes = {
  questions: questionsMarkup,
  writing: () =>
    `<p class="fact lead making-wait">The lead writes the whole story and the script from your request and your answers.</p>`,
  story: storyMarkup,
  planning: () =>
    `<p class="fact lead making-wait">The lead splits the story into chapters and plans the shots of each chapter.</p>`,
  chapters: chaptersMarkup,
  pictures: picturesMarkup,
};

export function paneMarkup() {
  return panes[run.phase]();
}
