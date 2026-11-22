import { renderClipSheet } from "./clipSheet.js";
import { renderExportSheet } from "./exportSheet.js";
import { renderLowerRows } from "./lowerRows.js";
import { renderMaking, stopMaking } from "./making.js";
import { renderNotes } from "./notes.js";
import { renderPreview } from "./preview.js";
import { renderScenesRow } from "./scenesRow.js";
import { renderSettings } from "./settings.js";
import { renderSide } from "./side.js";
import { renderStart } from "./start.js";
import { change, onChange, state } from "./state.js";

const element = (id) => document.getElementById(id);
const sheets = {
  clip: renderClipSheet,
  export: renderExportSheet,
  settings: renderSettings,
};
const shown = { screen: undefined };

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
  if (state.sheet !== undefined) {
    sheets[state.sheet]({ element: element("sheet-content") });
  }
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
  if (state.screen === "making" && entered) {
    renderMaking({ element: element("making") });
  }
  if (state.screen !== "making") {
    stopMaking();
  }
  if (state.screen === "editor") {
    element("project-name").textContent = "What is yumekit";
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
element("ask-jump").addEventListener("click", () => {
  change({ sideTab: "chat" });
  element("side").scrollIntoView({ block: "end" });
  element("ask-box").focus();
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
renderNotes({ element: element("notes") });
onChange(render);
render();
