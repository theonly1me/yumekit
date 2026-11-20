import type { ProjectState } from "../format/state.js";
import { timelineFile, type RuleFailure } from "./ruleFailure.js";

interface IdList {
  ids: string[];
  listName: string;
  file: string;
}

function findDuplicate(ids: string[]): string | undefined {
  const seen = new Set<string>();
  return ids.find((id) => {
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
    return false;
  });
}

function listsOfIds(state: ProjectState): IdList[] {
  const timelineLists = state.timelines.flatMap((timeline) => [
    {
      ids: timeline.tracks.map((track) => track.id),
      listName: "tracks",
      file: timelineFile(timeline.outputId),
    },
    {
      ids: timeline.tracks.flatMap((track) =>
        track.clips.map((clip) => clip.id),
      ),
      listName: "clips",
      file: timelineFile(timeline.outputId),
    },
  ]);
  return [
    {
      ids: state.project.outputs.map((output) => output.id),
      listName: "outputs",
      file: "project.json",
    },
    {
      ids: state.bible.cast.map((member) => member.id),
      listName: "cast",
      file: "bible.json",
    },
    {
      ids: state.scenes.map((scene) => scene.id),
      listName: "scenes",
      file: "scenes",
    },
    {
      ids: state.assets.map((asset) => asset.id),
      listName: "assets",
      file: "assets/index.json",
    },
    ...timelineLists,
  ];
}

export function checkUniqueIds(state: ProjectState): RuleFailure | undefined {
  for (const list of listsOfIds(state)) {
    const duplicate = findDuplicate(list.ids);
    if (duplicate !== undefined) {
      return {
        kind: "id-in-use",
        message: `The id "${duplicate}" is used more than once in ${list.listName}.`,
        file: list.file,
      };
    }
  }
  return undefined;
}
