import { firstChapters } from "./film.js";
import { state } from "./state.js";
import {
  clipItems,
  cutItem,
  pictureItems,
  replacementOf,
} from "./takeItems.js";
import { seededNotes } from "./takeNotes.js";
import { takes } from "./takesStore.js";

function addTake({ chapterId, step, items, carried = [], takeState }) {
  items.forEach((item) => takes.items.set(item.id, item));
  const list = takes.byChapter[chapterId];
  const take = {
    chapterId,
    number: list.length + 1,
    step,
    state: takeState,
    itemIds: [...carried, ...items.map((item) => item.id)],
    planned: items.length,
    queue: [],
  };
  list.push(take);
  return take;
}

function scenesOf(chapterId) {
  return state.scenes.filter((scene) => scene.chapterId === chapterId);
}

function chapterOf(chapterId) {
  return state.chapters.find((chapter) => chapter.id === chapterId);
}

function approveAll(items) {
  items.forEach((item) => (item.verdict = "approved"));
}

function seedDoneChapter(chapterId) {
  const chapter = chapterOf(chapterId);
  const scenes = scenesOf(chapterId);
  const pictures = pictureItems({ chapter, scenes, take: 1 });
  approveAll(pictures);
  const first = addTake({
    chapterId,
    step: "pictures",
    items: pictures,
    takeState: "sent",
  });
  const shots = pictures.filter((item) => item.section === "shots");
  const clips = clipItems({ shots, take: 2, chapterId });
  approveAll(clips.filter((item) => item.kind === "clip"));
  const music = clips.filter((item) => item.kind === "music");
  [...music.entries()].forEach(([index, item]) => {
    item.verdict = index === 0 ? "approved" : "declined";
  });
  const second = addTake({
    chapterId,
    step: "clips",
    items: clips,
    carried: first.itemIds,
    takeState: "sent",
  });
  const cut = cutItem({ chapter, scenes, take: 3 });
  cut.verdict = "approved";
  addTake({
    chapterId,
    step: "cut",
    items: [cut],
    carried: second.itemIds,
    takeState: "ready",
  });
}

function pinOf({ x, y, text }) {
  return { kind: "pin", x, y, text };
}

function seedPicturesChapter(chapterId) {
  const chapter = chapterOf(chapterId);
  const items = pictureItems({ chapter, scenes: scenesOf(chapterId), take: 1 });
  approveAll(items);
  const find = (test) => items.find(test);
  const pell = find((item) => item.slot === `${chapterId}-pell-base-turn`);
  pell.picture.fault = true;
  pell.verdict = "declined";
  pell.note = seededNotes.turnPell;
  pell.check = { passed: false, text: "Design check: coat color, no" };
  pell.comments.push(
    pinOf({
      x: 0.75,
      y: 0.62,
      text: "The coat is olive on the back. Make it green, like the front.",
    }),
  );
  const rope = find((item) => item.title === "Pell catches the rope");
  rope.picture.mirror = true;
  rope.verdict = "declined";
  rope.note = seededNotes.ropeShot;
  rope.check = {
    passed: false,
    text: "Design check: rope in the right hand, no",
  };
  rope.comments.push(
    pinOf({
      x: 0.42,
      y: 0.5,
      text: "Rope in his right hand, as on his sheet.",
    }),
  );
  const fog = find((item) => item.slot === `${chapterId}-place-fog`);
  fog.note = seededNotes.fogPlace;
  fog.comments.push({
    kind: "note",
    text: "Good. Keep the wall this tall in every shot.",
  });
  find((item) => item.title === "Ferry lantern").verdict = "waiting";
  find((item) => item.title === "Two boats, one rope").verdict = "waiting";
  const first = addTake({
    chapterId,
    step: "pictures",
    items,
    takeState: "sent",
  });
  const again = [pell, rope].map((item) => replacementOf({ item, take: 2 }));
  addTake({
    chapterId,
    step: "pictures",
    items: again,
    carried: first.itemIds,
    takeState: "ready",
  });
}

function reset() {
  takes.items.clear();
  Object.keys(takes.byChapter).forEach(
    (chapterId) => (takes.byChapter[chapterId] = []),
  );
}

export function seedAdvanced() {
  reset();
  state.chapters = structuredClone(firstChapters);
  seedDoneChapter("c1");
  seedPicturesChapter("c2");
  Object.assign(takes.view, {
    chapterId: "c2",
    takeNumber: undefined,
    filter: "all",
  });
}

export function seedFresh() {
  reset();
  state.chapters = structuredClone(firstChapters).map((chapter) => ({
    ...chapter,
    step: "story",
  }));
  Object.assign(takes.view, {
    chapterId: "c1",
    takeNumber: undefined,
    filter: "all",
  });
}

export { addTake };
