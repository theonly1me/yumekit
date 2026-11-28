import { bell, newProject, projects, session } from "./projects.js";
export function projectActions({ go, render, phone, openProject, parent }) {
  return {
    back: () => go(parent[session.page]),
    create: () => go("create"),
    connection: () => go("connection"),
    share: () => go("share"),
    export: () => go("export"),
    takes: () => go("takes"),
    pictures: () => {
      const p = session.project;
      p.scenes = bell.scenes;
      p.notes = {};
      p.take += 1;
      p.stage = "Pictures";
      session.shot = 0;
      go("takes");
    },
    finish: () => {
      session.project.stage = "Finished";
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
      const p = session.project;
      const notes = p.scenes
        .filter((s) => p.notes[s.id])
        .map((s) => `${s.title}: ${p.notes[s.id]}`);
      p.messages.push({
        author: "You",
        body: notes.length
          ? notes.join("\n")
          : "I approve these pictures. Continue to clips.",
      });
      p.stage = notes.length ? "Changes requested" : "Clips";
      go("project");
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
