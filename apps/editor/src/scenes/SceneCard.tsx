import type { KeyboardEvent } from "react";
import type { SceneClip } from "../engine/snapshot.js";

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
  onPick: () => void;
  onKeyMove: (step: number) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onAdd: () => void;
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
        aria-pressed={card.isPicked}
        data-shown={card.isShown}
        onClick={props.onPick}
        onKeyDown={onKeyDown}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", card.clip.id);
          props.onDragStart();
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          props.onDrop();
        }}
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
          {card.isVideo ? ", video clip" : ""}
        </span>
      </button>
      <button
        type="button"
        className="plus"
        aria-label={`Add a scene after scene ${String(card.index + 1)}`}
        title="Add a scene here"
        onClick={props.onAdd}
      >
        +
      </button>
    </li>
  );
}
