import { firstFilmScenes } from "../film.js";

export function newProject({ title, brief, files, format }) {
  return {
    title,
    brief,
    files,
    format,
    messages: [],
    scenes: [],
    notes: {},
    stage: "Story",
    take: 0,
  };
}

export const film = newProject({
  title: "Unwritten",
  brief: "An anime trailer about a story coming to life.",
  files: [],
  format: "YouTube",
});
film.stage = "Finished";

export const bell = newProject({
  title: "The Ninth Bell",
  brief: "A young ferry pilot has one crossing to save her island.",
  files: [],
  format: "YouTube",
});
bell.scenes = firstFilmScenes
  .filter((scene) => scene.chapterId === "c2")
  .slice(0, 3);
bell.stage = "Pictures";
bell.take = 2;
export const projects = [bell, film];

export const session = {
  project: bell,
  page: "studio",
  online: true,
  paired: true,
  shot: 0,
  draft: "",
  format: "YouTube",
  files: [],
  template: "",
  feedback: "",
  editingNote: false,
};
