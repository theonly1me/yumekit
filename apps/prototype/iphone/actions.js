import { addPictureTake, finishCut, submitTake } from "./takeHistory.js";
import { newProject, projects, session } from "./projects.js";
export function projectActions({ go, render, phone, openProject, parent }) {
  return {
    back: () => go(parent[session.page]),
    create: () => go("create"),
    connection: () => go("connection"),
    share: () => go("share"),
    export: () => go("export"),
    project: () => go("project"),
    takes: () => go("takes"),
    latest: () => {
      session.project.selectedTake = session.project.takes.at(-1)?.number;
      go("review");
    },
    pictures: () => {
      addPictureTake(session.project);
      go("review");
    },
    finish: () => {
      finishCut(session.project);
      session.feedback = "";
      go("export");
    },
    start: () => {
      const brief = session.draft.trim();
      if (!brief) return;
      const p = newProject({
        title: brief.split("\n")[0].slice(0, 56),
        brief,
        files: session.files,
        format: session.format,
      });
      projects.unshift(p);
      session.draft = "";
      session.files = [];
      session.template = "";
      openProject(p);
    },
    note: () => {
      session.editingNote = !session.editingNote;
      render();
      phone.querySelector("#shot-note")?.focus();
    },
    submit: () => {
      submitTake(session.project);
      go("takes");
    },
    send: () => {
      const p = session.project;
      if (!p.messageDraft?.trim()) return;
      p.messages.push({ author: "You", body: p.messageDraft.trim() });
      p.messageDraft = "";
      render();
      phone.querySelector("#message").scrollIntoView({ block: "nearest" });
    },
    connect: () => {
      session.online = !session.online;
      session.paired = true;
      go(session.online ? "studio" : "connection");
    },
    unpair: () => {
      session.paired = false;
      session.online = false;
      go("connection");
    },
    photos: () => {
      session.feedback = "In the app, this saves the MP4 to Photos.";
      go("export");
    },
    files: () => {
      session.feedback = "In the app, this opens the Files picker for the MP4.";
      go("export");
    },
  };
}
