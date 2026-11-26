import type { ChapterEdits } from "../chapters/chapterEdits.js";
import type { ChapterCard, FilmChapters } from "../chapters/filmChapters.js";
import type { Asset, Scene, SceneClip } from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import { secondsText } from "../timeline/clock.js";
import { dropTargetProps, type DragKind } from "./dragData.js";
import type { CardFacts } from "./SceneCard.js";
import { stillKey } from "./useSceneStills.js";

export function isVideoScene(scene: Scene | undefined): boolean {
  return (
    scene?.source.kind === "kit" && scene.source.component === "video-clip"
  );
}

export interface CardContext {
  outputId: string;
  scenes: Scene[];
  assets: Asset[];
  stills: ReadonlyMap<string, string>;
  pickedClipId: string | undefined;
  shownClipId: string | undefined;
  framesPerSecond: number;
}

export function cardFactsOf(options: {
  card: ChapterCard;
  context: CardContext;
}): CardFacts {
  const { card, context } = options;
  return {
    clip: card.clip,
    index: card.index,
    title: sceneNameById({
      sceneId: card.clip.sceneId,
      scenes: context.scenes,
      assets: context.assets,
    }),
    lengthText: secondsText({
      frames: card.clip.durationFrames,
      framesPerSecond: context.framesPerSecond,
    }),
    isVideo: isVideoScene(
      context.scenes.find((scene) => scene.id === card.clip.sceneId),
    ),
    still: context.stills.get(
      stillKey({ outputId: context.outputId, clipId: card.clip.id }),
    ),
    isPicked: card.clip.id === context.pickedClipId,
    isShown: card.clip.id === context.shownClipId,
  };
}

export function cardDropOf(options: {
  card: ChapterCard;
  film: FilmChapters;
  chapterEdits: ChapterEdits;
  onOver: (kind: DragKind | undefined) => void;
  onDropItem: (drop: { assetId: string; clip: SceneClip }) => void;
}) {
  const { card, film, chapterEdits } = options;
  return dropTargetProps({
    accepts: ["scene", "line", "take-item"],
    onOver: options.onOver,
    onDrop: (dropped) => {
      const moved = film.cards.find((each) => each.clip.id === dropped.id);
      if (dropped.kind === "scene" && moved !== undefined) {
        chapterEdits.dropScene({ card: moved, onto: card });
      }
      if (dropped.kind === "line" && card.shotId !== undefined) {
        chapterEdits.moveLine({ leftId: dropped.id, firstShotId: card.shotId });
      }
      if (dropped.kind === "take-item") {
        options.onDropItem({ assetId: dropped.id, clip: card.clip });
      }
    },
  });
}
