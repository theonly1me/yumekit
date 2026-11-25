import { startChapterPictures } from "./chapterWork.js";
import { firstRequest, storyQuestions } from "./chatSeed.js";
import { stopWork } from "./leadWork.js";
import { paneMarkup, run } from "./makingParts.js";
import { openTake } from "./readySignal.js";
import { change, escapeText, notify, state } from "./state.js";
import { approveStory, resetStory } from "./storySheet.js";
import { seedFresh } from "./takesSeed.js";
import { latestTake } from "./takesStore.js";

const thinkMilliseconds = 1700;
const steps = [
  {
    id: "story",
    label: "Story",
    phases: ["questions", "writing", "story"],
    time: "3 min 10 s",
  },
  {
    id: "chapters",
    label: "Chapters and shots",
    phases: ["planning", "chapters"],
    time: "1 min 20 s",
  },
  { id: "pictures", label: "Pictures", phases: ["pictures"], time: "" },
  { id: "clips", label: "Clips", phases: [], time: "" },
  { id: "cut", label: "Cut", phases: [], time: "" },
];
const waitingPhases = new Set(["questions", "story", "chapters"]);

function picturesReady() {
  return run.phase === "pictures" && latestTake("c1")?.state === "ready";
}

function statusOf(step) {
  const order = steps.flatMap((each) => each.phases);
  if (step.phases.includes(run.phase)) {
    return waitingPhases.has(run.phase) || picturesReady() ? "you" : "now";
  }
  const last = order.indexOf(step.phases.at(-1));
  return last !== -1 && last < order.indexOf(run.phase) ? "done" : "next";
}

function stepMarkup(step) {
  const status = statusOf(step);
  const words = {
    done: step.time,
    now: "Working",
    you: "Waits for you",
    next: "",
  };
  return `<li data-status="${status}"><span class="step-row"><span class="step-mark" aria-hidden="true"></span><span>${step.label}</span><em>${words[status]}</em></span></li>`;
}

function later(phase) {
  clearTimeout(run.timer);
  run.timer = setTimeout(() => {
    run.phase = phase;
    notify();
  }, thinkMilliseconds);
}

function isAnswered(answer) {
  return answer.choice !== undefined || answer.words.trim() !== "";
}

function sendAnswers() {
  state.chat = [{ kind: "you", text: state.prompt }];
  [...storyQuestions.entries()].forEach(([index, question]) => {
    const answer = run.answers[index];
    state.chat.push({
      kind: "question",
      ...question,
      answer: answer.words.trim() || answer.choice,
    });
  });
  run.phase = "writing";
  later("story");
  notify();
}

function bindPane(element) {
  const on = (selector) => (action) =>
    element.querySelector(selector)?.addEventListener("click", action);
  element.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      run.answers[Number(button.dataset.answer)].choice = button.dataset.option;
      notify();
    });
  });
  element.querySelectorAll("[data-own-words]").forEach((input) => {
    input.addEventListener("input", () => {
      run.answers[Number(input.dataset.ownWords)].words = input.value;
      element.querySelector("[data-send-answers]").disabled =
        !run.answers.every(isAnswered);
    });
  });
  on("[data-send-answers]")(sendAnswers);
  on("[data-read-story]")(() => change({ sheet: "story" }));
  on("[data-approve-story]")(() => {
    approveStory();
    run.phase = "planning";
    later("chapters");
    notify();
  });
  on("[data-see-chapters]")(() =>
    change({ screen: "editor", timelineOpen: true }),
  );
  on("[data-approve-chapters]")(() => {
    run.phase = "pictures";
    startChapterPictures("c1");
  });
  on("[data-open-take]")(() => openTake({ chapterId: "c1", number: 1 }));
  on("[data-editor]")(() =>
    change({ screen: "editor", activePlatformId: state.platformIds[0] }),
  );
}

export function stopMaking() {
  clearTimeout(run.timer);
}

export function enterMaking() {
  stopMaking();
  stopWork();
  seedFresh();
  resetStory();
  run.phase = "questions";
  state.prompt = state.prompt.trim() === "" ? firstRequest : state.prompt;
  run.answers.forEach((answer) =>
    Object.assign(answer, { choice: undefined, words: "" }),
  );
}

export function renderMaking({ element }) {
  const active = document.activeElement?.id;
  const title = picturesReady()
    ? "Take 1 is ready for you"
    : "Making your film";
  element.innerHTML = `
    <div class="making-body">
      <p class="fact making-request">${escapeText(state.prompt)}</p>
      <h2 class="making-title" aria-live="polite">${title}</h2>
      <div class="making-desk">
        <div class="making-side">
          <ol class="making-steps">${steps.map(stepMarkup).join("")}</ol>
          <p class="fact">The lead stops at the end of each step and waits for you.</p>
        </div>
        <div class="making-part"><div class="part"><div class="part-body">${paneMarkup()}</div></div></div>
      </div>
    </div>`;
  bindPane(element);
  if (active !== undefined && active !== "") {
    element.querySelector(`#${active}`)?.focus();
  }
}
