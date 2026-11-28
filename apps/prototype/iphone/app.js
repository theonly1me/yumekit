import { activeSection, projectHeader, projectNav } from "./projectNav.js";
import { footer } from "./dock.js";
import { viewedTake } from "./takeHistory.js";
import { takeList, review } from "./review.js";
import { projectActions } from "./actions.js";
import { templates } from "../templates.js";
import { currentTheme, setTheme, storedTheme } from "../theme.js";
import { bell, film, projects, session } from "./projects.js";
import {
  button,
  connection,
  create,
  exportView,
  project,
  share,
  studio,
  chat,
} from "./views.js";

const phone = document.querySelector("#phone");
const shortcuts = document.querySelector("#shortcuts");
const screens = {
  studio,
  create,
  project,
  takes: takeList,
  review,
  chat,
  export: exportView,
  connection,
  share,
};
const labels = {
  studio: "Studio",
  create: "New project",
  project: "Project",
  takes: "Takes",
  chat: "Chat",
  export: "Export",
  connection: "Pairing",
};
const parent = {
  studio: "studio",
  create: "studio",
  project: "studio",
  takes: "studio",
  review: "takes",
  chat: "studio",
  export: "studio",
  connection: "studio",
  share: "export",
};

function render() {
  const home = session.page === "studio";
  const back = button({ action: "back", label: "‹ Back", style: "link-btn" });
  const host = button({
    action: "connection",
    label: `<i class="dot"></i>Mac ${session.online ? "connected" : "offline"}`,
    style: "mac",
  });
  const bar = home
    ? `<strong>yumekit</strong>${host}`
    : activeSection(session.page)
      ? projectHeader()
      : `${back}<small>${labels[session.page] ?? "Share"}</small>`;
  const dock = footer();
  phone.innerHTML = `<header class="phone-bar">${bar}</header><section class="screen">${screens[session.page]()}</section>${dock ? `<footer class="dock">${dock}</footer>` : ""}${projectNav()}`;
  shortcuts.innerHTML = Object.entries(labels)
    .map(
      ([key, label]) =>
        `<button data-screen="${key}" aria-current="${session.page === key ? "page" : "false"}">${label}</button>`,
    )
    .join("");
}

function go(page) {
  session.page = page;
  session.editingNote = false;
  render();
  phone.focus({ preventScroll: true });
}

function openProject(p) {
  session.project = p;
  session.feedback = "";
  go(session.online ? "project" : "connection");
}

const actions = projectActions({ go, render, phone, openProject, parent });

phone.addEventListener("click", (event) => {
  const el = event.target.closest("button");
  if (!el) return;
  if (el.dataset.section) go(el.dataset.section);
  if (el.dataset.take) {
    session.project.selectedTake = Number(el.dataset.take);
    go("review");
  }
  if (el.dataset.action) actions[el.dataset.action]();
  if (el.dataset.project !== undefined)
    openProject(projects[Number(el.dataset.project)]);
  if (el.dataset.template) {
    const t = templates.find((item) => item.id === el.dataset.template);
    session.template = t.id;
    session.draft = t.guide;
    render();
    phone.querySelector("#brief").focus();
  }
  if (el.dataset.shot !== undefined) {
    viewedTake(session.project).shot = Number(el.dataset.shot);
    session.editingNote = false;
    render();
  }
});

phone.addEventListener("input", ({ target }) => {
  if (target.id === "brief") {
    session.draft = target.value;
    phone.querySelector('[data-action="start"]').disabled =
      !target.value.trim();
  }
  if (target.id === "message") {
    session.project.messageDraft = target.value;
    phone.querySelector('[data-action="send"]').disabled = !target.value.trim();
  }
  if (target.id === "shot-note") {
    const take = viewedTake(session.project);
    take.notes[take.scenes[take.shot].id] = target.value.trim();
    phone.querySelector("footer").innerHTML = footer();
  }
});

phone.addEventListener("change", ({ target }) => {
  if (target.id === "take-picker") {
    session.project.selectedTake = Number(target.value);
    go("review");
  }
  if (target.id === "format") session.format = target.value;
  if (target.id === "media") {
    session.files.push(...Array.from(target.files, (file) => file.name));
    render();
  }
});

shortcuts.addEventListener("click", (event) => {
  const page = event.target.closest("button")?.dataset.screen;
  if (!page) return;
  if (page === "connection") {
    session.paired = false;
    session.online = false;
  } else {
    session.online = true;
    session.paired = true;
  }
  if (page === "takes" || page === "project" || page === "chat") {
    session.project = bell;
  }
  if (page === "export") session.project = film;
  go(page);
});

document
  .querySelector("#theme")
  .addEventListener("click", () =>
    setTheme(currentTheme() === "dark" ? "light" : "dark"),
  );
setTheme(storedTheme());
render();
