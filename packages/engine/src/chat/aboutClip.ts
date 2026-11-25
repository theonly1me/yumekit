import type { ProjectSnapshot } from "@yumekit/project";
import type { Outcome } from "../engineTypes.js";
import type { ChatFailure, RequestAbout } from "./chatTypes.js";
import { filesTextOf } from "./questions/personText.js";
import type { RequestFile } from "./questions/questionSchemas.js";

export function aboutOf(options: {
  snapshot: ProjectSnapshot;
  clipId: string | undefined;
}): Outcome<RequestAbout | null, ChatFailure> {
  const { snapshot, clipId } = options;
  if (clipId === undefined) return { ok: true, value: null };
  const clip = snapshot.timelines
    .flatMap((timeline) => timeline.tracks)
    .flatMap((track) => (track.kind === "scene" ? track.clips : []))
    .find((candidate) => candidate.id === clipId);
  const scene = snapshot.scenes.find(
    (candidate) => candidate.id === clip?.sceneId,
  );
  if (clip === undefined || scene === undefined) {
    return {
      ok: false,
      failure: {
        kind: "clip-not-found",
        message: "The picked scene is not in the project now.",
      },
    };
  }
  return {
    ok: true,
    value: { sceneId: scene.id, clipId: clip.id, title: scene.title },
  };
}

export function requestTextOf(options: {
  text: string;
  about: RequestAbout | null;
  files?: RequestFile[] | undefined;
}): string {
  const { about } = options;
  const text = [options.text, filesTextOf(options.files ?? [])]
    .filter((part) => part !== "")
    .join("\n\n");
  if (about === null) return text;
  return `The person picked the scene "${about.title}" (scene id ${about.sceneId}, clip id ${about.clipId}).\n${text}`;
}
