import { notify, state } from "./state.js";

export const takes = {
  items: new Map(),
  drafts: new Map(),
  byChapter: { c1: [], c2: [], c3: [], c4: [] },
  view: {
    chapterId: "c2",
    takeNumber: undefined,
    filter: "all",
    openItemId: undefined,
    compareItemId: undefined,
    confirm: undefined,
  },
};

export const stepNames = {
  pictures: "pictures",
  clips: "clips and music",
  cut: "the cut",
};

export function itemOf(itemId) {
  return takes.items.get(itemId);
}

export function takesOf(chapterId) {
  return takes.byChapter[chapterId] ?? [];
}

export function latestTake(chapterId) {
  return takesOf(chapterId).at(-1);
}

export function shownTake() {
  const list = takesOf(takes.view.chapterId);
  return (
    list.find((take) => take.number === takes.view.takeNumber) ?? list.at(-1)
  );
}

export function itemsOf(take) {
  return take.itemIds.map(itemOf);
}

export function currentItemsOf(take) {
  const items = itemsOf(take);
  const replaced = new Set(items.map((item) => item.replaces));
  return items.filter((item) => !replaced.has(item.id));
}

export function total(numbers) {
  let sum = 0;
  for (const number of numbers) {
    sum += number;
  }
  return sum;
}

export function isInUse(item) {
  if (item.verdict !== "approved") {
    return false;
  }
  const later = [...takes.items.values()].some(
    (other) =>
      other.slot === item.slot &&
      other.take > item.take &&
      other.verdict === "approved",
  );
  return !later;
}

export function countsOf(take) {
  const items = itemsOf(take);
  const count = (test) => items.filter(test).length;
  return {
    approved: count((item) => item.verdict === "approved"),
    declined: count((item) => item.verdict === "declined"),
    waiting: count((item) => item.verdict === "waiting"),
    comments: total(items.map((item) => item.comments.length)),
    newItems: count((item) => item.take === take.number),
  };
}

export function costOf(take) {
  const made = itemsOf(take).filter((item) => item.take === take.number);
  const sum = (list) => total(list.map((item) => item.cost));
  return {
    spent: sum(made),
    declined: sum(made.filter((item) => item.verdict === "declined")),
  };
}

export function waitingForPerson() {
  return total(
    Object.keys(takes.byChapter)
      .map(latestTake)
      .filter((take) => take?.state === "ready")
      .map((take) => countsOf(take).waiting),
  );
}

export function makingTake() {
  return Object.keys(takes.byChapter)
    .map(latestTake)
    .find((take) => take?.state === "making");
}

export function projectSpent() {
  return total([...takes.items.values()].map((item) => item.cost));
}

export function realSeconds() {
  return total(
    [...takes.items.values()]
      .filter((item) => item.kind === "clip")
      .map((item) => item.seconds),
  );
}

function markVerdict({ item, verdict }) {
  item.verdict = verdict;
  const chapter = state.chapters.find(
    (candidate) => candidate.id === item.chapterId,
  );
  if (item.section === "cut" && chapter !== undefined) {
    chapter.step = item.verdict === "approved" ? "done" : "cut";
  }
}

export function setVerdict({ item, verdict }) {
  markVerdict({
    item,
    verdict: item.verdict === verdict ? "waiting" : verdict,
  });
  notify();
}

export function useMusic(item) {
  const take = shownTake();
  itemsOf(take)
    .filter((other) => other.section === "music" && other.id !== item.id)
    .forEach((other) => (other.verdict = "declined"));
  item.verdict = "approved";
  notify();
}

export function approveRest(take) {
  currentItemsOf(take)
    .filter((item) => item.verdict === "waiting")
    .forEach((item) => markVerdict({ item, verdict: "approved" }));
  notify();
}

export function addComment({ item, comment }) {
  const later = item.comments.findIndex(
    (other) =>
      comment.kind === "moment" &&
      other.kind === "moment" &&
      other.seconds > comment.seconds,
  );
  item.comments.splice(later === -1 ? item.comments.length : later, 0, comment);
  notify();
}

export function removeComment({ item, index }) {
  item.comments.splice(index, 1);
  notify();
}

export function changeView(patch) {
  Object.assign(takes.view, patch);
  notify();
}

export function money(amount) {
  return `$${amount.toFixed(2)}`;
}
