import { picturesPlan } from "./chapterWork.js";
import { chapterNumber, chapterOf, progressText } from "./leadWork.js";
import { escapeText, state } from "./state.js";
import {
  costOf,
  itemsOf,
  money,
  stepNames,
  takes,
  takesOf,
} from "./takesStore.js";

const filters = [
  ["all", "All", () => true],
  ["new", "New", ({ item, take }) => item.take === take.number],
  ["waiting", "Waiting for me", ({ item }) => item.verdict === "waiting"],
  ["approved", "Approved", ({ item }) => item.verdict === "approved"],
  ["declined", "Declined", ({ item }) => item.verdict === "declined"],
  ["comments", "With comments", ({ item }) => item.comments.length > 0],
];

export const sections = [
  ["cut", "The cut"],
  ["clips", "Clips"],
  ["music", "Music"],
  ["characters", "Characters and their looks"],
  ["places", "Places"],
  ["props", "Props"],
  ["shots", "Shots"],
];

export const stepLabels = {
  story: "Story",
  pictures: "Pictures",
  clips: "Clips",
  cut: "Cut",
  done: "Done",
};

export function visibleItems(take) {
  const [, , test] =
    filters.find(([id]) => id === takes.view.filter) ?? filters[0];
  const items = itemsOf(take).filter((item) => test({ item, take }));
  return sections.flatMap(([id]) =>
    items.filter((item) => item.section === id),
  );
}

function chapterTabsMarkup() {
  return state.chapters
    .map(
      (chapter) =>
        `<button type="button" class="chapter-tab" data-chapter="${chapter.id}" aria-pressed="${chapter.id === takes.view.chapterId}"><span>${chapterNumber(chapter.id)}. ${escapeText(chapter.name)}</span><em data-step="${chapter.step}">${stepLabels[chapter.step]}</em></button>`,
    )
    .join("");
}

function stateMarkup(take) {
  const head = `<strong>Take ${take.number}: ${stepNames[take.step]}.</strong>`;
  if (take.state === "making") {
    const share = (take.planned - take.queue.length) / take.planned;
    return `<p class="take-state" data-state="making">${head} ${progressText(take)}. You can review what is here now.</p><div class="progress wide"><i style="width:${share * 100}%"></i></div>`;
  }
  const latest = takesOf(take.chapterId).at(-1) === take;
  const words = latest ? "Ready for you." : "Your notes went to the lead.";
  return `<p class="take-state" data-state="${latest ? take.state : "sent"}">${head} ${words}</p>`;
}

export function headMarkup(take) {
  const cost = costOf(take);
  const pickers = takesOf(take.chapterId)
    .map(
      (each) =>
        `<button type="button" data-take="${each.number}" aria-pressed="${each === take}" data-state="${each.state}">Take ${each.number}</button>`,
    )
    .join("");
  const filterButtons = filters
    .map(([id, label, test]) => {
      const count = itemsOf(take).filter((item) => test({ item, take })).length;
      return `<button type="button" class="chip" data-filter="${id}" aria-pressed="${takes.view.filter === id}">${label}<span>${count}</span></button>`;
    })
    .join("");
  const declined =
    cost.declined === 0
      ? ""
      : ` ${money(cost.declined)} of it went to work that you declined.`;
  return `
    <header class="takes-head">
      <nav class="chapter-tabs" aria-label="Chapters">${chapterTabsMarkup()}</nav>
      <div class="takes-title">
        <h2>${escapeText(chapterOf(take.chapterId).name)}</h2>
        <div class="take-picker" role="group" aria-label="Takes of this chapter">${pickers}</div>
      </div>
      ${stateMarkup(take)}
      <p class="take-cost">This take cost ${money(cost.spent)}.${declined}</p>
      <div class="filters" role="group" aria-label="Show">${filterButtons}</div>
    </header>`;
}

export function emptyMarkup() {
  const chapter = chapterOf(takes.view.chapterId);
  const plan = picturesPlan(chapter.id);
  return `
    <div class="takes">
      <header class="takes-head"><nav class="chapter-tabs" aria-label="Chapters">${chapterTabsMarkup()}</nav><div class="takes-title"><h2>${escapeText(chapter.name)}</h2></div></header>
      <div class="takes-empty">
        <p class="fact lead">No takes yet. Each round of pictures, clips, and the cut of this chapter shows here as a take.</p>
        <p class="take-price">Pictures for chapter ${chapterNumber(chapter.id)}: ${plan.count} pictures, about ${plan.price}.</p>
        <button type="button" class="primary" data-make-pictures>Make the pictures</button>
      </div>
    </div>`;
}
