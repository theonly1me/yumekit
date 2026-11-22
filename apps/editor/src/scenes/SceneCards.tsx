import { useEffect, useRef } from "react";
import type { Output, Scene, SceneClip } from "../engine/snapshot.js";
import { secondsText } from "../timeline/clock.js";
import { SceneCard, type CardFacts } from "./SceneCard.js";
import { stillKey } from "./useSceneStills.js";
import "./scenes.css";

const videoComponent = "video-clip";

export function isVideoScene(scene: Scene | undefined): boolean {
  return (
    scene?.source.kind === "kit" && scene.source.component === videoComponent
  );
}

export function SceneCards(props: {
  output: Output;
  clips: SceneClip[];
  scenes: Scene[];
  stills: ReadonlyMap<string, string>;
  pickedClipId: string | undefined;
  shownClipId: string | undefined;
  framesPerSecond: number;
  onPick: (clip: SceneClip) => void;
  onMove: (move: { clip: SceneClip; toIndex: number }) => void;
}) {
  const { output, clips, scenes, stills, framesPerSecond } = props;
  const dragged = useRef<SceneClip | undefined>(undefined);
  const list = useRef<HTMLOListElement>(null);
  const keyMovedClipId = useRef<string | undefined>(undefined);
  const order = clips.map((clip) => clip.id).join(" ");
  const { pickedClipId } = props;

  useEffect(() => {
    if (pickedClipId === undefined) return;
    list.current
      ?.querySelector(`[data-card="${CSS.escape(pickedClipId)}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pickedClipId]);

  useEffect(() => {
    const clipId = keyMovedClipId.current;
    if (clipId === undefined) return;
    keyMovedClipId.current = undefined;
    list.current
      ?.querySelector<HTMLButtonElement>(`[data-card="${CSS.escape(clipId)}"]`)
      ?.focus();
  }, [order]);

  const cards: CardFacts[] = clips.map((...[clip, index]) => {
    const scene = scenes.find((candidate) => candidate.id === clip.sceneId);
    return {
      clip,
      index,
      title: scene?.title ?? clip.sceneId,
      lengthText: secondsText({ frames: clip.durationFrames, framesPerSecond }),
      isVideo: isVideoScene(scene),
      still: stills.get(stillKey({ outputId: output.id, clipId: clip.id })),
      isPicked: clip.id === props.pickedClipId,
      isShown: clip.id === props.shownClipId,
    };
  });
  return (
    <ol className="cards" aria-label="Scenes" ref={list}>
      {cards.map((card) => (
        <SceneCard
          key={card.clip.id}
          card={card}
          onPick={() => {
            props.onPick(card.clip);
          }}
          onKeyMove={(step) => {
            const toIndex = card.index + step;
            if (toIndex < 0 || toIndex >= clips.length) return;
            keyMovedClipId.current = card.clip.id;
            props.onMove({ clip: card.clip, toIndex });
          }}
          onDragStart={() => {
            dragged.current = card.clip;
          }}
          onDrop={() => {
            const clip = dragged.current;
            dragged.current = undefined;
            if (clip === undefined || clip.id === card.clip.id) return;
            props.onMove({ clip, toIndex: card.index });
          }}
        />
      ))}
    </ol>
  );
}
