import { record, state } from "./state.js";

let nextChapter = 4;

function chapterIndex(chapterId) {
  return state.chapters.findIndex((chapter) => chapter.id === chapterId);
}

export function scenesIn(chapterId) {
  return state.scenes.filter((scene) => scene.chapterId === chapterId);
}

function tidy() {
  state.chapters = state.chapters.filter(
    (chapter) => scenesIn(chapter.id).length > 0,
  );
  state.scenes = state.chapters.flatMap((chapter) => scenesIn(chapter.id));
}

export function chapterLength(chapterId) {
  let seconds = 0;
  for (const scene of scenesIn(chapterId)) {
    seconds += scene.seconds;
  }
  return seconds;
}

export function minutesText(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function chapterName(chapterId) {
  const chapter = state.chapters[chapterIndex(chapterId)];
  return `${chapterIndex(chapterId) + 1}. ${chapter?.name ?? ""}`;
}

export function moveSceneTo({ sceneId, chapterId, beforeId }) {
  const scene = state.scenes.find((candidate) => candidate.id === sceneId);
  if (scene === undefined || sceneId === beforeId) {
    return;
  }
  record({
    text: `You moved "${scene.title}" to chapter ${chapterName(chapterId)}.`,
    apply: () => {
      const rest = state.scenes.filter((candidate) => candidate.id !== sceneId);
      const at = rest.findIndex((candidate) => candidate.id === beforeId);
      rest.splice(at === -1 ? rest.length : at, 0, { ...scene, chapterId });
      state.scenes = rest;
      tidy();
    },
  });
}

export function moveChapter({ chapterId, beforeId }) {
  if (chapterId === beforeId) {
    return;
  }
  record({
    text: `You moved the chapter "${state.chapters[chapterIndex(chapterId)].name}".`,
    apply: () => {
      const moved = state.chapters[chapterIndex(chapterId)];
      const rest = state.chapters.filter((chapter) => chapter.id !== chapterId);
      const at = rest.findIndex((chapter) => chapter.id === beforeId);
      rest.splice(at === -1 ? rest.length : at, 0, moved);
      state.chapters = rest;
      tidy();
    },
  });
}

export function moveLine({ leftId, firstSceneId }) {
  const left = chapterIndex(leftId);
  const right = state.chapters[left + 1];
  const order = state.scenes.map((scene) => scene.id);
  const start = order.indexOf(scenesIn(leftId)[0]?.id);
  const end = order.indexOf(scenesIn(right?.id).at(-1)?.id);
  const cut = order.indexOf(firstSceneId);
  if (right === undefined || cut <= start || cut > end) {
    return;
  }
  record({
    text: `You moved the line between chapter ${left + 1} and chapter ${left + 2}.`,
    apply: () => {
      [...state.scenes.entries()].forEach(([index, scene]) => {
        if (index >= start && index <= end) {
          scene.chapterId = index < cut ? leftId : right.id;
        }
      });
      tidy();
    },
  });
}

export function renameChapter({ chapterId, name }) {
  const chapter = state.chapters[chapterIndex(chapterId)];
  if (name === "" || name === chapter.name) {
    return;
  }
  record({
    text: `You renamed chapter ${chapterIndex(chapterId) + 1} to "${name}".`,
    apply: () => (chapter.name = name),
  });
}

export function splitAt(sceneId) {
  const scene = state.scenes.find((candidate) => candidate.id === sceneId);
  const siblings = scenesIn(scene.chapterId);
  if (siblings[0].id === sceneId) {
    return;
  }
  nextChapter += 1;
  const fresh = {
    id: `c${nextChapter}`,
    name: `From ${scene.title}`,
    step: "story",
    cast: [],
    places: [],
    props: [],
  };
  record({
    text: `You split chapter ${chapterIndex(scene.chapterId) + 1} at "${scene.title}".`,
    apply: () => {
      const from = siblings.findIndex((candidate) => candidate.id === sceneId);
      siblings.slice(from).forEach((each) => (each.chapterId = fresh.id));
      state.chapters.splice(chapterIndex(scene.chapterId) + 1, 0, fresh);
      tidy();
    },
  });
}

export function joinNext(chapterId) {
  const next = state.chapters[chapterIndex(chapterId) + 1];
  if (next === undefined) {
    return;
  }
  record({
    text: `You joined chapter ${chapterIndex(chapterId) + 1} and chapter ${chapterIndex(chapterId) + 2}.`,
    apply: () => {
      scenesIn(next.id).forEach((scene) => (scene.chapterId = chapterId));
      tidy();
    },
  });
}
