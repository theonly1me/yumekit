import { renderChat } from "./chatPanel.js";
import { chapterNumber, chapterOf } from "./leadWork.js";
import { bindFoot } from "./projectActions.js";
import { footMarkup } from "./projectFoot.js";
import { bindFilm, filmMarkup } from "./projectFilm.js";
import { flow } from "./projectFlow.js";
import { bindTake, takeMarkup } from "./projectTake.js";
import { change, escapeText, state } from "./state.js";
import { bindStoryArticle, storyArticleMarkup } from "./storySheet.js";
import { shownTake, takes, takesOf } from "./takesStore.js";

const steps = [
  ["story", "Story"],
  ["pictures", "Pictures"],
  ["clips", "Clips"],
  ["cut", "Cut"],
];
const order = ["story", "pictures", "clips", "cut", "done"];

export function viewOf() {
  if (flow.phase === "questions" || flow.phase === "writing") {
    return "waiting";
  }
  if (flow.phase === "story" || state.projectView === "story") {
    return "story";
  }
  const take = shownTake();
  if (take === undefined) {
    return "empty";
  }
  if (state.projectView === "film" || take.step === "cut") {
    return "film";
  }
  return take.state === "making" ? "work" : "take";
}

function railMarkup() {
  const chapter = chapterOf(takes.view.chapterId);
  const now = order.indexOf(chapter.step);
  const view = viewOf();
  const shownStep =
    view === "story" || view === "waiting"
      ? "story"
      : view === "film"
        ? "cut"
        : (shownTake()?.step ?? chapter.step);
  return steps
    .map(([id, name]) => {
      const index = order.indexOf(id);
      const status = index < now ? "done" : index === now ? "now" : "next";
      return `<li><button type="button" class="rail-step" data-rail="${id}" data-status="${status}" aria-current="${shownStep === id ? "step" : "false"}" ${status === "next" ? "disabled" : ""}>${name}</button></li>`;
    })
    .join("");
}

function chapterMenuMarkup() {
  const options = state.chapters
    .map(
      (chapter) =>
        `<option value="${chapter.id}" ${chapter.id === takes.view.chapterId ? "selected" : ""}>Chapter ${chapterNumber(chapter.id)} of ${state.chapters.length}, ${escapeText(chapter.name)}</option>`,
    )
    .join("");
  return `<label class="chapter-menu"><span class="hidden-label">Chapter</span><select data-chapter-menu>${options}</select></label>`;
}

function waitingMarkup() {
  const writing = flow.phase === "writing";
  return `
    <div class="work-wait">
      <p class="work-title">${writing ? "The lead writes the whole story" : "The lead reads your request"}</p>
      <p class="fact lead">${writing ? "It uses your request and your answers. The story shows here when it is ready." : "It asks you three questions in the chat. Answer them there, then it writes the whole story."}</p>
      ${writing ? `<div class="progress wide work-progress"><i></i></div>` : ""}
      <blockquote class="work-request">${escapeText(state.prompt)}</blockquote>
    </div>`;
}

function emptyMarkup() {
  return `<div class="work-wait"><p class="work-title">Nothing made yet</p><p class="fact lead">The lead makes this chapter when you start it. Each round of pictures, clips, and the cut shows here, one at a time.</p></div>`;
}

const views = {
  waiting: { markup: waitingMarkup, bind: () => undefined },
  story: {
    markup: () =>
      `<article class="story-sheet in-project">${storyArticleMarkup()}</article>`,
    bind: bindStoryArticle,
  },
  empty: { markup: emptyMarkup, bind: () => undefined },
  work: { markup: takeMarkup, bind: bindTake },
  take: { markup: takeMarkup, bind: bindTake },
  film: { markup: filmMarkup, bind: bindFilm },
};

function openStep(stepId) {
  if (stepId === "story") {
    change({ projectView: "story" });
    return;
  }
  if (stepId === "cut") {
    change({ projectView: "film" });
    return;
  }
  const take = takesOf(takes.view.chapterId).findLast(
    (each) => each.step === stepId,
  );
  takes.view.takeNumber = take?.number;
  change({ projectView: "take" });
}

export function renderProject({ element }) {
  const body = element.querySelector(".work-body");
  const scrollTop = body?.scrollTop ?? 0;
  const view = viewOf();
  element.innerHTML = `
    <div class="project-bar">
      <div class="identity"><button type="button" class="wordmark-button" data-home>yumekit</button><p class="project-name">The Ninth Bell</p></div>
      <ol class="step-rail" aria-label="Steps of this chapter">${railMarkup()}</ol>
      <div class="bar-actions">
        <button type="button" data-edit>Edit by hand</button>
        <button type="button" data-export>Export</button>
        <button type="button" data-settings>Settings</button>
      </div>
    </div>
    <div class="work" data-view="${view}">
      <div class="work-head">${flow.phase === "done" ? chapterMenuMarkup() : ""}</div>
      <div class="work-body">${views[view].markup()}</div>
      ${footMarkup(view)}
    </div>
    <aside class="project-chat" aria-label="Chat with the lead"></aside>`;
  views[view].bind(element);
  bindFoot({ element, view });
  renderChat({
    element: element.querySelector(".project-chat"),
    prefix: "project",
    chip: "",
  });
  element.querySelector(".work-body").scrollTop = scrollTop;
  const on = (selector) => (action) =>
    element.querySelector(selector)?.addEventListener("click", action);
  on("[data-home]")(() => change({ screen: "start" }));
  on("[data-edit]")(() => change({ screen: "editor" }));
  on("[data-export]")(() => change({ sheet: "export" }));
  on("[data-settings]")(() => change({ sheet: "settings" }));
  element.querySelectorAll("[data-rail]").forEach((button) => {
    button.addEventListener("click", () => openStep(button.dataset.rail));
  });
  element
    .querySelector("[data-chapter-menu]")
    ?.addEventListener("change", (event) => {
      Object.assign(takes.view, {
        chapterId: event.target.value,
        takeNumber: undefined,
      });
      change({ projectView: undefined });
    });
}
