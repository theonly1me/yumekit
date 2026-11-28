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
  takes,
} from "./views.js";

const phone = document.querySelector("#phone");
const shortcuts = document.querySelector("#shortcuts");
const screens = {
  studio,
  create,
  project,
  takes,
  export: exportView,
  connection,
  share,
};
const labels = {
  studio: "Studio",
  create: "New project",
  project: "Project",
  takes: "Review a take",
  export: "Export",
  connection: "Pairing",
};
const parent = {
  studio: "studio",
  create: "studio",
  project: "studio",
  takes: "project",
  export: "project",
  connection: "studio",
  share: "export",
};

function footer() {
  switch (session.page) {
    case "studio":
      return button({
        action: "create",
        label: "+ New project",
        style: "primary",
        disabled: !session.online,
      });
    case "create":
      return button({
        action: "start",
        label: "Start project",
        style: "primary",
        disabled: !session.draft.trim(),
      });
    case "takes":
      return button({
        action: "submit",
        label: Object.values(session.project.notes).some(Boolean)
          ? "Send take with changes"
          : "Approve take",
        style: "primary",
      });
    case "export":
      return button({ action: "share", label: "Share film", style: "primary" });
    case "connection":
      return button({
        action: "connect",
        label: session.paired
          ? session.online
            ? "Preview offline"
            : "Reconnect"
          : "Preview pairing",
        style: "primary",
      });
    default:
      return "";
  }
}

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
    : `${back}<small>${labels[session.page] ?? "Share"}</small>`;
  const dock = footer();
  phone.innerHTML = `<header class="phone-bar">${bar}</header><section class="screen">${screens[session.page]()}</section>${dock ? `<footer class="dock">${dock}</footer>` : ""}`;
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
  session.shot = 0;
  session.feedback = "";
  go(session.online ? "project" : "connection");
}

const actions = projectActions({ go, render, phone, openProject, parent });

phone.addEventListener("click", (event) => {
  const el = event.target.closest("button");
  if (!el) return;
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
    session.shot = Number(el.dataset.shot);
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
    session.project.notes[session.project.scenes[session.shot].id] =
      target.value.trim();
    phone.querySelector("footer").innerHTML = footer();
  }
});

phone.addEventListener("change", ({ target }) => {
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
  if (page === "takes" || page === "project") {
    session.project = bell;
    session.shot = 0;
  }
  if (page === "export") session.project = film;
  if (page === "takes" && bell.stage !== "Pictures") {
    bell.stage = "Pictures";
    bell.notes = {};
  }
  go(page);
});

document
  .querySelector("#theme")
  .addEventListener("click", () =>
    setTheme(currentTheme() === "dark" ? "light" : "dark"),
  );
setTheme(storedTheme());
render();
