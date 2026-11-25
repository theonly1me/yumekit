import {
  nextChapterOf,
  picturesPlan,
  startChapterPictures,
} from "./chapterWork.js";
import { bindWarning, guardCost } from "./costGuard.js";
import { prices } from "./takeItems.js";
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

function makeClipsWithLimit({ take, count }) {
  const seconds = (count ?? plannedClips(take).count) * 4;
  if (roomFor(seconds)) {
    makeClips({ take, count });
    return;
  }
  askToRaise({
    seconds,
    what: `The clips of chapter ${chapterNumber(take.chapterId)}`,
    onRaise: () => makeClips({ take, count }),
  });
}

function clipsWithMoney(take) {
  const planned = plannedClips(take);
  const perClip = 4 * prices.clipSecond;
  const music = 3 * prices.music;
  guardCost({
    cost: planned.count * perClip + music,
    what: "The clips",
    run: () => makeClipsWithLimit({ take, count: undefined }),
    fewer: (left) => {
      const count = Math.floor((left - music) / perClip);
      return count > 0
        ? {
            label: `Make fewer clips (${count})`,
            run: () => makeClipsWithLimit({ take, count }),
          }
        : undefined;
    },
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
    clipsWithMoney(take);
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
  pictures: () =>
    guardCost({
      cost: picturesPlan(takes.view.chapterId).cost,
      what: "The pictures",
      run: () => startChapterPictures(takes.view.chapterId),
      fewer: () => undefined,
    }),
  "stop-other": (take) => stopTake(take),
};

export function bindFoot({ element }) {
  bindWarning(element);
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
