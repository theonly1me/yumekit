import { chapterOf, makePictures, scenesOf } from "./leadWork.js";
import { state } from "./state.js";
import { pictureItems, prices } from "./takeItems.js";
import { changeView, money } from "./takesStore.js";

export function nextChapterOf(chapterId) {
  const index = state.chapters.findIndex((chapter) => chapter.id === chapterId);
  return state.chapters[index + 1]?.id;
}

export function picturesPlan(chapterId) {
  const chapter = chapterOf(chapterId);
  const count =
    chapter.cast.length * 2 +
    chapter.places.length +
    chapter.props.length +
    scenesOf(chapterId).flatMap((scene) => scene.shots).length;
  return {
    count,
    cost: count * prices.picture,
    price: money(count * prices.picture),
  };
}

export function startChapterPictures(chapterId) {
  const chapter = chapterOf(chapterId);
  makePictures({
    chapterId,
    makeItems: (take) =>
      pictureItems({ chapter, scenes: scenesOf(chapterId), take }),
  });
}

export function showChapter(chapterId) {
  changeView({ chapterId, takeNumber: undefined, filter: "all" });
}
