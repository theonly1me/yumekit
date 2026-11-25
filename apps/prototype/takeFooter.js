import { askToRaise, roomFor } from "./limits.js";
import {
  chapterNumber,
  makeClips,
  makeCut,
  needsNotes,
  plannedClips,
  sendNotes,
  shotPictures,
} from "./leadWork.js";
import { change, state } from "./state.js";
import { nextChapterOf, showChapter } from "./chapterWork.js";
import { prices } from "./takeItems.js";
import {
  approveRest,
  changeView,
  countsOf,
  currentItemsOf,
  money,
  takesOf,
} from "./takesStore.js";

function allApproved(items) {
  return items.length > 0 && items.every((item) => item.verdict === "approved");
}

function gateOf(take) {
  const items = currentItemsOf(take);
  const of = (section) => items.filter((item) => item.section === section);
  if (take.step === "pictures") {
    const shots = shotPictures(take);
    const waiting = shots.filter((item) => item.verdict !== "approved").length;
    return {
      id: "clips",
      label: "Make the clips",
      ready: !state.limits.approveFirst || waiting === 0,
      why: `Opens when every shot picture is approved. ${waiting} of ${shots.length} still wait.`,
    };
  }
  if (take.step === "clips") {
    const ready =
      allApproved(of("clips")) &&
      of("music").some((item) => item.verdict === "approved");
    return {
      id: "cut",
      label: "Make the cut",
      ready,
      why: "Opens when every clip is approved and one music is in use.",
    };
  }
  return {
    id: "done",
    label: "Next chapter",
    ready: allApproved(of("cut")),
    why: "Opens when you approve the cut.",
  };
}

function confirmMarkup(take) {
  const confirm = state.takeConfirm;
  if (confirm === undefined || confirm.chapterId !== take.chapterId) {
    return "";
  }
  return `
    <div class="take-confirm" role="group" aria-label="Price before the next step">
      <p>${confirm.text}</p>
      <button type="button" class="primary" data-confirm-yes>${confirm.yes}</button>
      <button type="button" data-confirm-no>Not now</button>
    </div>`;
}

export function footerMarkup(take) {
  const counts = countsOf(take);
  const latest = takesOf(take.chapterId).at(-1) === take;
  const summary = `<p class="take-counts"><b>${counts.approved}</b> approved, <b>${counts.declined}</b> declined, <b>${counts.comments}</b> comments<span>Keys: A approve, D decline, C comment, arrows to move</span></p>`;
  if (!latest) {
    return `<footer class="takes-foot">${summary}<button type="button" class="primary" data-latest>Open the latest take</button></footer>`;
  }
  const gate = gateOf(take);
  const notes = currentItemsOf(take).some(needsNotes);
  const making = take.state === "making";
  const doneButtons =
    gate.id === "done" && gate.ready
      ? `<button type="button" data-export>Export</button><button type="button" class="primary" data-next-chapter>Next chapter</button>`
      : `<button type="button" class="primary" data-gate ${gate.ready && !making ? "" : "disabled"} title="${gate.why}">${gate.label}</button>`;
  return `
    <footer class="takes-foot">
      ${summary}
      ${confirmMarkup(take)}
      <div class="foot-actions">
        ${counts.waiting === 0 ? "" : `<button type="button" data-approve-rest>Approve the rest (${counts.waiting})</button>`}
        <button type="button" data-send-notes ${notes && !making ? "" : "disabled"}>Send my notes to the lead</button>
        ${doneButtons}
      </div>
      ${gate.ready || making ? "" : `<p class="gate-why">${gate.why}</p>`}
    </footer>`;
}

function askClips(take) {
  const planned = plannedClips(take);
  const price = money(planned.seconds * prices.clipSecond);
  change({
    takeConfirm: {
      chapterId: take.chapterId,
      text: `Clips for chapter ${chapterNumber(take.chapterId)}: ${planned.count} clips, ${planned.seconds} seconds of real video, about ${price}. Make them?`,
      yes: "Make the clips",
      run: () => {
        if (roomFor(planned.seconds)) {
          makeClips({ take, count: undefined });
          return;
        }
        askToRaise({
          seconds: planned.seconds,
          what: `The clips of chapter ${chapterNumber(take.chapterId)}`,
          onRaise: () => makeClips({ take, count: undefined }),
        });
        change({ sheet: undefined, sideTab: "chat" });
      },
    },
  });
}

export function bindFooter({ element, take }) {
  const on = (selector) => (action) =>
    element.querySelector(selector)?.addEventListener("click", action);
  on("[data-latest]")(() => changeView({ takeNumber: undefined }));
  on("[data-approve-rest]")(() => approveRest(take));
  on("[data-send-notes]")(() => sendNotes(take));
  on("[data-gate]")(() => {
    if (take.step === "pictures") {
      askClips(take);
      return;
    }
    makeCut(take);
  });
  on("[data-confirm-yes]")(() => {
    const run = state.takeConfirm.run;
    state.takeConfirm = undefined;
    run();
  });
  on("[data-confirm-no]")(() => change({ takeConfirm: undefined }));
  on("[data-export]")(() => change({ sheet: "export" }));
  on("[data-next-chapter]")(() => {
    const next = nextChapterOf(take.chapterId);
    if (next === undefined) {
      change({ sheet: "export" });
      return;
    }
    showChapter(next);
  });
}
