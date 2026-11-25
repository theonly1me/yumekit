import { renderClipSheet } from "./clipSheet.js";
import { renderExportSheet } from "./exportSheet.js";
import { renderLowerRows } from "./lowerRows.js";
import { chapterNumber, progressText } from "./leadWork.js";
import { renderProject } from "./project.js";
import { showSampleProject, startProject } from "./projectFlow.js";
import { renderNotes } from "./notes.js";
import { renderPartSheet } from "./parts.js";
import { renderPreview } from "./preview.js";
import { renderScenesRow } from "./scenesRow.js";
import { renderSettings } from "./settings.js";
import { renderSide } from "./side.js";
import { renderStart } from "./start.js";
import { change, onChange, state } from "./state.js";
import { renderStartOptions } from "./startOptions.js";
import { renderStorySheet } from "./storySheet.js";
import { renderTakesSheet } from "./takes.js";
import { seedAdvanced } from "./takesSeed.js";
import { makingTake, waitingForPerson } from "./takesStore.js";

const element = (id) => document.getElementById(id);
const sheets = {
  clip: renderClipSheet,
  export: renderExportSheet,
  settings: renderSettings,
  takes: renderTakesSheet,
  "start-options": renderStartOptions,
  story: renderStorySheet,
  script: renderPartSheet("script"),
  pictures: renderPartSheet("pictures"),
  voice: renderPartSheet("voice"),
  music: renderPartSheet("music"),
};
const partSheets = new Set(["script", "pictures", "voice", "music"]);
const shown = { screen: undefined, sheet: undefined };

function storedTheme() {
  try {
    return localStorage.getItem("yumekit-design-theme") ?? "dark";
  } catch {
    return "dark";
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  element("theme").textContent =
    theme === "dark" ? "Show the light version" : "Show the dark version";
  try {
    localStorage.setItem("yumekit-design-theme", theme);
  } catch {
    return;
  }
}

function renderSheet() {
  const sheet = element("sheet");
  sheet.hidden = state.sheet === undefined;
  document.body.dataset.sheet = state.sheet ?? "none";
  const entered = shown.sheet !== state.sheet;
  shown.sheet = state.sheet;
  if (state.sheet !== undefined && (entered || !partSheets.has(state.sheet))) {
    sheets[state.sheet]({ element: element("sheet-content") });
  }
}

function renderWorkLine() {
  const take = makingTake();
  const waiting = waitingForPerson();
  element("takes-count").textContent = waiting === 0 ? "" : String(waiting);
  element("work-line").textContent =
    take === undefined
      ? waiting === 0
        ? "Nothing waits for you"
        : `${waiting} wait for you in Takes`
      : `Chapter ${chapterNumber(take.chapterId)}: ${progressText(take).replace("The lead is making", "making")}`;
  element("work-line").dataset.working = String(take !== undefined);
}

function render() {
  const main = element("app");
  const entered = shown.screen !== state.screen;
  shown.screen = state.screen;
  main.dataset.screen = state.screen;
  if (entered) {
    window.scrollTo({ top: 0 });
  }
  if (state.screen === "start") {
    renderStart({ element: element("start") });
  }
  if (state.screen === "project") {
    renderProject({ element: element("project") });
  }
  if (state.screen === "editor") {
    renderWorkLine();
    renderPreview({ element: element("preview") });
    renderScenesRow({ element: element("scenes-row") });
    renderLowerRows({ element: element("lower-rows") });
    renderSide({ element: element("side") });
  }
  renderSheet();
  document.querySelectorAll("[data-go]").forEach((button) => {
    const [screen, sheet] = button.dataset.go.split(":");
    button.setAttribute(
      "aria-pressed",
      String(state.screen === screen && (state.sheet ?? "") === (sheet ?? "")),
    );
  });
}

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    const [screen, sheet] = button.dataset.go.split(":");
    if (screen === "new-project") {
      startProject();
      return;
    }
    if (screen === "project" && sheet === undefined) {
      showSampleProject();
      return;
    }
    if (sheet === "chapters") {
      change({ screen, sheet: undefined, timelineOpen: true, playing: false });
      document
        .querySelector(".chapter-row")
        ?.scrollIntoView({ block: "start" });
      return;
    }
    change({ screen, sheet, playing: false });
    window.scrollTo({ top: 0 });
  });
});

document.querySelectorAll("[data-open-sheet]").forEach((button) => {
  button.addEventListener("click", () =>
    change({ sheet: button.dataset.openSheet, playing: false }),
  );
});

element("sheet-close").addEventListener("click", () =>
  change({ sheet: undefined }),
);
element("home").addEventListener("click", () =>
  change({ screen: "start", sheet: undefined, playing: false }),
);
element("back-to-project").addEventListener("click", () =>
  change({ screen: "project", sheet: undefined, playing: false }),
);
element("ask-jump").addEventListener("click", () => {
  change({ sideTab: "chat" });
  element("side").scrollIntoView({ block: "end" });
  element("editor-ask-box").focus();
});
element("theme").addEventListener("click", () =>
  setTheme(
    document.documentElement.dataset.theme === "dark" ? "light" : "dark",
  ),
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.sheet !== undefined) {
    change({ sheet: undefined });
  }
});

setTheme(storedTheme());
seedAdvanced();
renderNotes({ element: element("notes") });
onChange(render);
render();
