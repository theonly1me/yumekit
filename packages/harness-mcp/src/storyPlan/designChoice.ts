import type {
  Asset,
  DesignCheck,
  Edit,
  ProjectSnapshot,
  Shot,
} from "@yumekit/project";
import { designCheckOf } from "../critic/design/designRecord.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import { isOpen, keyPictureIdsOf } from "./designGate.js";
import { shotIdOf } from "./shotOfAsset.js";

interface Chosen {
  snapshot: ProjectSnapshot;
  edits: Edit[];
}

function chosenCheckOf(options: {
  shot: Shot;
  assetId: string;
  words: string;
}): DesignCheck | undefined {
  const { shot, assetId, words } = options;
  const check = designCheckOf({ shot, assetId });
  if (check === undefined) {
    return {
      assetId,
      by: "person",
      frames: [],
      breaks: [],
      personKept: { words },
    };
  }
  return isOpen(check) ? undefined : { ...check, personKept: { words } };
}

export function withPersonChoice(options: {
  snapshot: ProjectSnapshot;
  shotId: string;
  assetIds: string[];
  words: string;
}): Chosen {
  const { snapshot, shotId, assetIds, words } = options;
  const plan = snapshot.bible.storyPlan;
  const shot = plan?.shots.find((candidate) => candidate.id === shotId);
  if (plan === undefined || shot === undefined) return { snapshot, edits: [] };
  const chosen = assetIds.flatMap((assetId) => {
    const check = chosenCheckOf({ shot, assetId, words });
    return check === undefined ? [] : [check];
  });
  if (chosen.length === 0) return { snapshot, edits: [] };
  const others = (shot.designChecks ?? []).filter(
    (check) => !chosen.some((entry) => entry.assetId === check.assetId),
  );
  const bible = {
    ...snapshot.bible,
    storyPlan: {
      ...plan,
      shots: plan.shots.map((candidate) =>
        candidate.id === shotId
          ? { ...candidate, designChecks: [...others, ...chosen] }
          : candidate,
      ),
    },
  };
  return {
    snapshot: { ...snapshot, bible },
    edits: [{ kind: "setBible", bible }],
  };
}

export function withChosenPictures(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): Chosen {
  const { snapshot, request } = options;
  const words = request.person_chose_this_picture;
  if (words === undefined || request.shot_id === undefined) {
    return { snapshot, edits: [] };
  }
  return withPersonChoice({
    snapshot,
    shotId: request.shot_id,
    assetIds: keyPictureIdsOf(request),
    words,
  });
}

export function withChosenClip(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  words: string | undefined;
}): Chosen {
  const { snapshot, asset, words } = options;
  const shotId = shotIdOf(asset);
  if (words === undefined || shotId === undefined) {
    return { snapshot, edits: [] };
  }
  return withPersonChoice({ snapshot, shotId, assetIds: [asset.id], words });
}
