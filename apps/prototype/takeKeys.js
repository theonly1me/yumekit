import { state } from "./state.js";
import { closeLarge, stepItem } from "./takeLarge.js";
import { frameSeconds, playerOf, seek, togglePlay } from "./takeMedia.js";
import {
  changeView,
  itemOf,
  setVerdict,
  takes,
  useMusic,
} from "./takesStore.js";

const bound = { done: false };

function isTyping(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

function focusedItem() {
  const card = document.activeElement?.closest?.(".take-card");
  return card === null || card === undefined
    ? undefined
    : itemOf(card.dataset.item);
}

function answer({ item, verdict }) {
  if (item.kind === "music" && verdict === "approved") {
    useMusic(item);
    return;
  }
  setVerdict({ item, verdict });
}

function onLargeKey(event) {
  const item = itemOf(takes.view.openItemId);
  const keys = {
    Escape: closeLarge,
    ArrowRight: () => stepItem(1),
    ArrowLeft: () => stepItem(-1),
    a: () => answer({ item, verdict: "approved" }),
    d: () => answer({ item, verdict: "declined" }),
    c: () => {
      takes.view.focusId = `large-note-${item.id}`;
      changeView({ commentingId: item.id });
    },
    " ": () => item.kind !== "picture" && togglePlay(item),
    ",": () => seek({ item, seconds: playerOf(item).seconds - frameSeconds }),
    ".": () => seek({ item, seconds: playerOf(item).seconds + frameSeconds }),
  };
  return keys[event.key];
}

function onGridKey(event) {
  const item = focusedItem();
  if (takes.view.compareItemId !== undefined && event.key === "Escape") {
    return closeLarge;
  }
  if (item === undefined) {
    return undefined;
  }
  const move = (step) => {
    const cards = [...document.querySelectorAll(".take-card")];
    const index = cards.findIndex((card) => card.dataset.item === item.id);
    cards[Math.min(cards.length - 1, Math.max(0, index + step))]?.focus();
  };
  const keys = {
    Enter: () => changeView({ openItemId: item.id }),
    ArrowRight: () => move(1),
    ArrowLeft: () => move(-1),
    a: () => answer({ item, verdict: "approved" }),
    d: () => answer({ item, verdict: "declined" }),
    c: () => {
      takes.view.focusId = `card-note-${item.id}`;
      changeView({ commentingId: item.id });
    },
  };
  return keys[event.key];
}

function onKey(event) {
  if (state.sheet !== "takes") {
    return;
  }
  const overlayOpen =
    takes.view.openItemId !== undefined ||
    takes.view.compareItemId !== undefined;
  if (event.key === "Escape" && overlayOpen) {
    event.preventDefault();
    event.stopPropagation();
    closeLarge();
    return;
  }
  if (isTyping(event.target)) {
    return;
  }
  const action =
    takes.view.openItemId === undefined ? onGridKey(event) : onLargeKey(event);
  if (action === undefined) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  action();
}

export function bindTakeKeys() {
  if (bound.done) {
    return;
  }
  bound.done = true;
  window.addEventListener("keydown", onKey, true);
}
