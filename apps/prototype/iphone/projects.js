import { addPictureTake, finishCut, submitTake } from "./takeHistory.js";

export function newProject({ title, brief, files, format }) {
  return {
    title,
    brief,
    files,
    format,
    messages: [],
    takes: [],
    selectedTake: undefined,
    stage: "Story",
  };
}

export const film = newProject({
  title: "Unwritten",
  brief: "An anime trailer about a story coming to life.",
  files: [],
  format: "YouTube",
});
finishCut(film);

export const bell = newProject({
  title: "The Ninth Bell",
  brief: "A young ferry pilot has one crossing to save her island.",
  files: [],
  format: "YouTube",
});
const first = addPictureTake(bell);
first.notes[first.scenes[0].id] = "Bring Wren closer as the ferry leaves.";
submitTake(bell);
addPictureTake(bell);
export const projects = [bell, film];

export const session = {
  project: bell,
  page: "studio",
  online: true,
  paired: true,
  draft: "",
  format: "YouTube",
  files: [],
  template: "",
  feedback: "",
  editingNote: false,
};
