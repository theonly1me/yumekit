import { escapeText as text } from "../state.js";
import { session } from "./projects.js";

const sections = {
  project: { name: "Project", icon: "M3 7h7l2 2h9v11H3z M3 7V5h7l2 2h8v2" },
  takes: {
    name: "Takes",
    icon: "M4 8h16v12H4z M4 8l-1-4 16-2 1 4z M8 4l3 3 M14 3l3 3",
  },
  chat: { name: "Chat", icon: "M4 4h16v12H9l-5 4z M8 8h8 M8 12h5" },
  export: { name: "Export", icon: "M12 15V3 M8 7l4-4 4 4 M6 11H4v10h16V11h-2" },
};

export function activeSection(page) {
  if (page === "review") return "takes";
  if (page === "share") return "export";
  return Object.hasOwn(sections, page) ? page : undefined;
}

export function projectHeader() {
  const inReview = session.page === "review",
    inShare = session.page === "share";
  const label = inReview ? "Takes" : inShare ? "Export" : "Studio";
  return `<button class="link-btn" data-action="back">‹ ${label}</button><b class="host-project">${text(session.project.title)}</b>`;
}

export function projectNav() {
  const active = activeSection(session.page);
  if (!active) return "";
  return `<nav class="project-nav" aria-label="Project navigation">${Object.entries(
    sections,
  )
    .map(
      ([page, section]) =>
        `<button data-section="${page}" ${active === page ? 'aria-current="page"' : ""}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="${section.icon}" /></svg>${section.name}</button>`,
    )
    .join("")}</nav>`;
}
