import { firstFilmScenes } from "../film.js";

const pictures = firstFilmScenes
  .filter((scene) => scene.chapterId === "c2")
  .slice(0, 3);

export function addPictureTake(project) {
  const previous = project.takes.at(-1);
  const scenes = previous?.scenes ?? pictures;
  const take = {
    kind: "Pictures",
    number: project.takes.length + 1,
    status: "Ready for review",
    notes: {},
    shot: 0,
    scenes: scenes.map((scene) => ({
      ...scene,
      variant: (scene.variant ?? 0) + (previous?.notes[scene.id] ? 1 : 0),
    })),
  };
  project.takes.push(take);
  project.selectedTake = take.number;
  project.stage = "Pictures";
  return take;
}

export function viewedTake(project) {
  return (
    project.takes.find((take) => take.number === project.selectedTake) ??
    project.takes.at(-1)
  );
}

export function canReview(project) {
  const take = viewedTake(project);
  return (
    take !== undefined &&
    take === project.takes.at(-1) &&
    take.status === "Ready for review"
  );
}

export function submitTake(project) {
  if (!canReview(project)) return;
  const take = viewedTake(project);
  const notes = take.scenes
    .filter((scene) => take.notes[scene.id])
    .map((scene) => `${scene.title}: ${take.notes[scene.id]}`);
  take.status = notes.length ? "Changes requested" : "Approved";
  project.messages.push({
    author: "You",
    body: `Take ${take.number} · ${take.status}\n${notes.join("\n")}`.trim(),
    take: take.number,
  });
  project.stage = notes.length ? "Changes requested" : "Clips";
}

export function finishCut(project) {
  const take = {
    kind: "Cut",
    number: project.takes.length + 1,
    status: "Approved",
    scenes: project.takes.at(-1)?.scenes ?? [],
  };
  project.takes.push(take);
  project.selectedTake = take.number;
  project.stage = "Finished";
  project.messages.push({
    author: "The lead",
    body: "The finished film is ready to export.",
    take: take.number,
  });
}
