import { nextChapterOf, startChapterPictures } from "./chapterWork.js";
import {
  chapterNumber,
  makeClips,
  makeCut,
  plannedClips,
  sendNotes,
  stopTake,
} from "./leadWork.js";
import { askToRaise, roomFor } from "./limits.js";
import { cutOf } from "./projectFilm.js";
import { approveStoryAndPlan, flow } from "./projectFlow.js";
import { change, state } from "./state.js";
import { sendStoryNotes } from "./storySheet.js";
import { approveUnmarked, setVerdict, shownTake, takes } from "./takesStore.js";

function makeClipsWithLimit(take) {
  const planned = plannedClips(take);
  if (roomFor(planned.seconds)) {
    makeClips(take);
    return;
  }
  askToRaise({
    seconds: planned.seconds,
    what: `The clips of chapter ${chapterNumber(take.chapterId)}`,
    onRaise: () => makeClips(take),
  });
}

const actions = {
  "send-story": sendStoryNotes,
  "approve-story": approveStoryAndPlan,
  back: () => change({ projectView: undefined }),
  latest: () => {
    takes.view.takeNumber = undefined;
    change({});
  },
  send: (take) => {
    approveUnmarked(take);
    sendNotes(take);
  },
  clips: (take) => {
    approveUnmarked(take);
    makeClipsWithLimit(take);
  },
  cut: (take) => {
    approveUnmarked(take);
    makeCut(take);
  },
  "approve-cut": () =>
    setVerdict({ item: cutOf(takes.view.chapterId), verdict: "approved" }),
  export: () => change({ sheet: "export" }),
  "export-other": () => change({ sheet: "export" }),
  next: () => {
    Object.assign(takes.view, {
      chapterId: nextChapterOf(takes.view.chapterId),
      takeNumber: undefined,
    });
    change({ projectView: undefined });
  },
  pictures: () => startChapterPictures(takes.view.chapterId),
  "stop-other": (take) => stopTake(take),
};

export function bindFoot({ element }) {
  element.querySelectorAll("[data-foot]").forEach((button) => {
    button.addEventListener("click", () => {
      const take = shownTake();
      state.projectView =
        button.dataset.foot === "back" ? undefined : state.projectView;
      if (
        flow.phase !== "done" &&
        button.dataset.foot !== "approve-story" &&
        button.dataset.foot !== "send-story"
      ) {
        return;
      }
      actions[button.dataset.foot](take);
    });
  });
}
