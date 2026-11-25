import { startChapterPictures } from "./chapterWork.js";
import { escapeText } from "./state.js";
import { bindItem, cardMarkup } from "./takeCard.js";
import { bindFooter, footerMarkup } from "./takeFooter.js";
import { emptyMarkup, headMarkup, sections, visibleItems } from "./takeHead.js";
import { bindTakeKeys } from "./takeKeys.js";
import { bindLarge, largeMarkup } from "./takeLarge.js";
import { changeView, itemOf, shownTake, takes } from "./takesStore.js";

function groupsMarkup({ items, take }) {
  const groups = [];
  items.forEach((item) => {
    const last = groups.at(-1);
    if (last !== undefined && last.name === item.group) {
      last.items.push(item);
      return;
    }
    groups.push({ name: item.group, items: [item] });
  });
  return groups
    .map(
      (group) =>
        `${group.name === undefined ? "" : `<h4 class="group-name">${escapeText(group.name)}</h4>`}<div class="take-grid">${group.items.map((item) => cardMarkup({ item, take })).join("")}</div>`,
    )
    .join("");
}

function sectionsMarkup(take) {
  const items = visibleItems(take);
  const shown = sections.filter(([id]) =>
    items.some((item) => item.section === id),
  );
  if (shown.length === 0) {
    return `<p class="fact lead takes-empty">Nothing here. Pick another filter.</p>`;
  }
  return shown
    .map(([id, name]) => {
      const list = items.filter((item) => item.section === id);
      const waiting = list.filter((item) => item.verdict === "waiting").length;
      return `
        <section class="take-section" id="section-${id}" data-section="${id}">
          <h3>${name}<span>${list.length}${waiting === 0 ? "" : `, ${waiting} waiting`}</span></h3>
          ${groupsMarkup({ items: list, take })}
        </section>`;
    })
    .join("");
}

function railMarkup(take) {
  const items = visibleItems(take);
  return sections
    .filter(([id]) => items.some((item) => item.section === id))
    .map(
      ([id, name]) =>
        `<a href="#section-${id}">${name}<span>${items.filter((item) => item.section === id).length}</span></a>`,
    )
    .join("");
}

function restoreFocus({ element, activeId }) {
  const id = takes.view.focusId ?? activeId;
  takes.view.focusId = undefined;
  const target = id === undefined ? null : element.querySelector(`#${id}`);
  if (target !== null) {
    target.focus({ preventScroll: true });
    if (target instanceof HTMLInputElement) {
      target.setSelectionRange(target.value.length, target.value.length);
    }
  }
}

export function renderTakesSheet({ element }) {
  bindTakeKeys();
  const activeId = document.activeElement?.id || undefined;
  const scroller = element.closest(".sheet");
  const scrollTop = scroller?.scrollTop ?? 0;
  const take = shownTake();
  takes.view.order =
    take === undefined ? [] : visibleItems(take).map((item) => item.id);
  if (take === undefined) {
    element.innerHTML = emptyMarkup();
  } else {
    element.innerHTML = `
      <div class="takes" data-state="${take.state}">
        ${headMarkup(take)}
        <div class="takes-body">
          <nav class="takes-rail" aria-label="Sections">${railMarkup(take)}</nav>
          <div class="takes-sections">${sectionsMarkup(take)}</div>
        </div>
        ${footerMarkup(take)}
        ${largeMarkup(take)}
      </div>`;
    element.querySelectorAll(".take-card").forEach((card) => {
      bindItem({
        element: card,
        item: itemOf(card.dataset.item),
        scope: "card",
      });
    });
    bindFooter({ element, take });
    bindLarge({ element, take });
  }
  element.querySelectorAll("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () =>
      changeView({ chapterId: button.dataset.chapter, takeNumber: undefined }),
    );
  });
  element.querySelectorAll("[data-take]").forEach((button) => {
    button.addEventListener("click", () =>
      changeView({ takeNumber: Number(button.dataset.take) }),
    );
  });
  element.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () =>
      changeView({ filter: button.dataset.filter }),
    );
  });
  element
    .querySelector("[data-make-pictures]")
    ?.addEventListener("click", () =>
      startChapterPictures(takes.view.chapterId),
    );
  if (scroller !== null) {
    scroller.scrollTop = scrollTop;
  }
  restoreFocus({ element, activeId });
}
