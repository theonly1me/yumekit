import type { KeyboardEvent, ReactNode } from "react";
import type { SceneClip } from "../engine/snapshot.js";
import { startDrag, type DragKind, type dropTargetProps } from "./dragData.js";

export interface CardFacts {
  clip: SceneClip;
  index: number;
  title: string;
  lengthText: string;
  isVideo: boolean;
  still: string | undefined;
  isPicked: boolean;
  isShown: boolean;
}

export function SceneCard(props: {
  card: CardFacts;
  over: DragKind | undefined;
  drop: ReturnType<typeof dropTargetProps>;
  onPick: () => void;
  onKeyMove: (step: number) => void;
  onAdd: () => void;
  mark?: ReactNode;
}) {
  const { card } = props;
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey || !card.isPicked) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    props.onKeyMove(event.key === "ArrowLeft" ? -1 : 1);
  };
  return (
    <li className="card-slot">
      <button
        type="button"
        className="card"
        draggable
        data-card={card.clip.id}
        data-over={props.over}
        aria-pressed={card.isPicked}
        data-shown={card.isShown}
        onClick={props.onPick}
        onKeyDown={onKeyDown}
        onDragStart={(event) => {
          startDrag({ event, kind: "scene", id: card.clip.id });
        }}
        {...props.drop}
      >
        <span className="thumb">
          {card.still === undefined ? undefined : (
            <img src={card.still} alt="" />
          )}
        </span>
        <span className="card-title">
          {card.index + 1}. {card.title}
        </span>
        <span className="card-facts">
          {card.lengthText}
          <span className="card-style" data-video={card.isVideo}>
            {card.isVideo ? "Video clip" : "Graphics"}
          </span>
        </span>
      </button>
      <span className="between">
        <button
          type="button"
          className="plus"
          aria-label={`Add a scene after scene ${String(card.index + 1)}`}
          title="Add a scene here"
          onClick={props.onAdd}
        >
          +
        </button>
        {props.mark}
      </span>
    </li>
  );
}
