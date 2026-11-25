import { chapterNumber, chapterOf } from "./leadWork.js";
import { escapeText } from "./state.js";
import { bindItem, commentsMarkup } from "./takeCard.js";
import { mediaMarkup } from "./takeMedia.js";
import { whatToCheckOf } from "./takeNotes.js";
import { currentItemsOf, shownTake, takes, takesOf } from "./takesStore.js";

export function cutOf(chapterId) {
  const take = takesOf(chapterId).findLast((each) => each.step === "cut");
  return take === undefined
    ? undefined
    : currentItemsOf(take).find((item) => item.section === "cut");
}

export function filmMarkup() {
  const chapterId = takes.view.chapterId;
  const chapter = chapterOf(chapterId);
  const cut = cutOf(chapterId);
  if (cut === undefined) {
    return `<div class="work-wait"><p class="work-title">No cut yet</p><p class="fact lead">The lead puts chapter ${chapterNumber(chapterId)} together when you approve its clips.</p></div>`;
  }
  takes.view.simple = true;
  const making = shownTake()?.state === "making";
  return `
    <div class="film" data-item-film="${cut.id}">
      <p class="film-title">Chapter ${chapterNumber(chapterId)}, ${escapeText(chapter.name)}${making ? ". The lead puts it together." : ""}</p>
      ${mediaMarkup({ item: cut, large: true })}
      <p class="check-line"><span>What to check</span>${escapeText(whatToCheckOf(cut))}</p>
      <div class="film-notes">${commentsMarkup({ item: cut, scope: "film" })}</div>
    </div>`;
}

export function bindFilm(element) {
  const film = element.querySelector("[data-item-film]");
  if (film === null) {
    return;
  }
  const cut = cutOf(takes.view.chapterId);
  bindItem({ element: film, item: cut, scope: "film" });
}
