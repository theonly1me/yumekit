import { ringReady } from "./readySignal.js";
import { notify, state } from "./state.js";
import { clipItems, cutItem, replacementOf } from "./takeItems.js";
import {
  currentItemsOf,
  latestTake,
  stepNames,
  takes,
  takesOf,
} from "./takesStore.js";

const itemMilliseconds = 320;
const work = { timer: undefined };

export function chapterOf(chapterId) {
  return state.chapters.find((chapter) => chapter.id === chapterId);
}

export function chapterNumber(chapterId) {
  return state.chapters.findIndex((chapter) => chapter.id === chapterId) + 1;
}

export function scenesOf(chapterId) {
  return state.scenes.filter((scene) => scene.chapterId === chapterId);
}

function finish(take) {
  take.state = "ready";
  const text = `Take ${take.number} of chapter ${chapterNumber(take.chapterId)} is ready for you: ${take.planned} new.`;
  state.chat.push({
    kind: "take",
    text,
    action: {
      label: `Open take ${take.number}`,
      go: "takes",
      chapterId: take.chapterId,
      number: take.number,
    },
  });
  ringReady({ text: `Take ${take.number} is ready for you`, take });
}

function tick() {
  const take = Object.values(takes.byChapter)
    .map((list) => list.at(-1))
    .find((candidate) => candidate?.state === "making");
  if (take === undefined) {
    clearInterval(work.timer);
    work.timer = undefined;
    return;
  }
  const next = take.queue.shift();
  if (next !== undefined) {
    takes.items.set(next.id, next);
    take.itemIds.push(next.id);
  }
  if (take.queue.length === 0) {
    finish(take);
  }
  notify();
}

export function stopTake(take) {
  take.planned -= take.queue.length;
  take.queue = [];
  finish(take);
  notify();
}

export function startTake({ chapterId, step, makeItems }) {
  const list = takesOf(chapterId);
  const last = list.at(-1);
  const number = list.length + 1;
  const queue = makeItems(number);
  if (last !== undefined) {
    last.state = "sent";
  }
  list.push({
    chapterId,
    number,
    step,
    state: "making",
    itemIds: [...(last?.itemIds ?? [])],
    planned: queue.length,
    queue,
  });
  chapterOf(chapterId).step = step;
  Object.assign(takes.view, {
    chapterId,
    takeNumber: undefined,
    confirm: undefined,
  });
  if (work.timer === undefined) {
    work.timer = setInterval(tick, itemMilliseconds);
  }
  notify();
}

export function needsNotes(item) {
  if (item.section === "music" && item.comments.length === 0) {
    return false;
  }
  return (
    item.verdict === "declined" ||
    (item.verdict === "waiting" && item.comments.length > 0)
  );
}

export function sendNotes(take) {
  const items = currentItemsOf(take).filter(needsNotes);
  startTake({
    chapterId: take.chapterId,
    step: take.step,
    makeItems: (number) =>
      items.map((item) => replacementOf({ item, take: number })),
  });
}

export function shotPictures(take) {
  return currentItemsOf(take).filter((item) => item.section === "shots");
}

export function plannedClips(take) {
  const shots = shotPictures(take);
  return { count: shots.length, seconds: shots.length * 4 };
}

export function makeClips({ take, count }) {
  const shots = shotPictures(take).slice(0, count);
  startTake({
    chapterId: take.chapterId,
    step: "clips",
    makeItems: (number) =>
      clipItems({ shots, take: number, chapterId: take.chapterId }),
  });
}

export function makeCut(take) {
  const chapter = chapterOf(take.chapterId);
  startTake({
    chapterId: take.chapterId,
    step: "cut",
    makeItems: (number) => [
      cutItem({ chapter, scenes: scenesOf(chapter.id), take: number }),
    ],
  });
}

export function makePictures({ chapterId, makeItems }) {
  startTake({ chapterId, step: "pictures", makeItems });
}

export function progressText(take) {
  const made = take.planned - take.queue.length;
  const noun = take.step === "cut" ? "cut" : stepNames[take.step];
  return take.planned === 1
    ? `The lead is making the ${noun}`
    : `The lead is making ${made} of ${take.planned} ${noun}`;
}

export function stopWork() {
  clearInterval(work.timer);
  work.timer = undefined;
}

export function resumeWork() {
  if (work.timer === undefined) {
    work.timer = setInterval(tick, itemMilliseconds);
  }
}

export { latestTake };
