import { chapterNumber, chapterOf, progressText } from "./leadWork.js";
import { escapeText } from "./state.js";
import { sections } from "./takeHead.js";
import { bindTakeKeys } from "./takeKeys.js";
import { bindLarge, largeMarkup } from "./takeLarge.js";
import { isUsedNow, verdictOf } from "./takeReview.js";
import { bindRows, rowMarkup } from "./takeRows.js";
import {
  changeView,
  itemsOf,
  shownTake,
  stepNames,
  takes,
  takesOf,
} from "./takesStore.js";

const filters = [
  ["all", "All", () => true],
  ["open", "Not reviewed", ({ item }) => verdictOf(item) === undefined],
  ["mistakes", "Has mistakes", ({ item }) => verdictOf(item) === "change"],
  ["in-use", "In use", ({ item }) => isUsedNow(item)],
  ["new", "New in this take", ({ item, take }) => item.take === take.number],
];

function testOf(id) {
  return (filters.find(([each]) => each === id) ?? filters[0])[2];
}

export function shownItems(take) {
  const test = testOf(takes.view.filter);
  const kept = takes.view.keptIds ?? [];
  const items = itemsOf(take).filter(
    (item) => test({ item, take }) || kept.includes(item.id),
  );
  return sections.flatMap(([id]) =>
    items.filter((item) => item.section === id),
  );
}

function filtersMarkup(take) {
  const items = itemsOf(take);
  const reviewed = items.filter((item) => verdictOf(item) !== undefined);
  const chips = filters
    .map(
      ([id, name, test]) =>
        `<button type="button" class="filter-chip" data-filter="${id}" aria-pressed="${takes.view.filter === id}">${name} <span class="filter-count">${items.filter((item) => test({ item, take })).length}</span></button>`,
    )
    .join("");
  return `
    <div class="take-filters">
      <p class="review-progress"><strong>${reviewed.length}</strong> of ${items.length} reviewed</p>
      <div class="filter-chips" role="group" aria-label="Show">${chips}</div>
    </div>`;
}

function summaryOf(take) {
  const made = itemsOf(take).filter((item) => item.take === take.number);
  if (take.state === "making") {
    return `${progressText(take)}.`;
  }
  const remade = made.filter((item) => item.replaces !== undefined).length;
  if (remade > 0) {
    return `The lead made ${remade} again from your notes.`;
  }
  return `The lead made ${made.length} new.`;
}

function rowsMarkup(take) {
  const items = shownItems(take);
  if (items.length === 0) {
    return `<p class="fact lead">Nothing here right now. <button type="button" class="link" data-filter="all">Show all</button></p>`;
  }
  return sections
    .filter(([id]) => items.some((item) => item.section === id))
    .map(
      ([id, name]) => `
        <section class="review-section" aria-label="${name}">
          <h3>${name}</h3>
          ${items
            .filter((item) => item.section === id)
            .map((item) => rowMarkup({ item, take }))
            .join("")}
        </section>`,
    )
    .join("");
}

function earlierMarkup(take) {
  const list = takesOf(take.chapterId);
  if (list.length < 2) {
    return "";
  }
  const options = list
    .map(
      (each) =>
        `<option value="${each.number}" ${each === take ? "selected" : ""}>Take ${each.number}, ${stepNames[each.step]}</option>`,
    )
    .join("");
  return `<label class="earlier"><span class="hidden-label">Earlier takes</span><select data-earlier>${options}</select></label>`;
}

export function takeMarkup() {
  const take = shownTake();
  const chapter = chapterOf(take.chapterId);
  const share = (take.planned - take.queue.length) / Math.max(1, take.planned);
  takes.view.order = shownItems(take).map((item) => item.id);
  takes.view.simple = true;
  return `
    <header class="take-slate-head">
      <div class="slate" aria-label="Take ${take.number}"><span>Take</span><strong>${take.number}</strong></div>
      <div class="slate-facts">
        <p>Chapter ${chapterNumber(chapter.id)}, ${escapeText(chapter.name)}. ${stepNames[take.step].charAt(0).toUpperCase()}${stepNames[take.step].slice(1)}.</p>
        <p class="fact lead">${summaryOf(take)}</p>
        ${take.state === "making" ? `<div class="progress wide"><i style="width:${share * 100}%"></i></div>` : ""}
        <div class="slate-controls">${earlierMarkup(take)}</div>
      </div>
    </header>
    ${filtersMarkup(take)}
    ${rowsMarkup(take)}
    ${largeMarkup(take)}`;
}

export function bindTake(element) {
  bindTakeKeys();
  const take = shownTake();
  element.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const test = testOf(button.dataset.filter);
      changeView({
        filter: button.dataset.filter,
        keptIds: itemsOf(take)
          .filter((item) => test({ item, take }))
          .map((item) => item.id),
      });
    });
  });
  element
    .querySelector("[data-earlier]")
    ?.addEventListener("change", (event) =>
      changeView({ takeNumber: Number(event.target.value) }),
    );
  bindRows({ element });
  bindLarge({ element });
}
