import { useState } from "react";
import type { ItemDraft } from "../review/itemDrafts.js";
import { stageStyleOf } from "./stageShape.js";

export function PinnedPicture(props: {
  url: string | undefined;
  caption: string;
  pins: ItemDraft["pins"];
  onPin: ((at: { x: number; y: number }) => void) | undefined;
}) {
  const [shape, setShape] = useState<number>();
  const { onPin } = props;
  return (
    <div
      className="stage-box pin-stage"
      data-kind="picture"
      data-pinnable={onPin !== undefined}
      style={stageStyleOf(shape)}
      onClick={(event) => {
        if (onPin === undefined) return;
        const box = event.currentTarget.getBoundingClientRect();
        onPin({
          x: (event.clientX - box.left) / box.width,
          y: (event.clientY - box.top) / box.height,
        });
      }}
    >
      {props.url === undefined ? undefined : (
        <img
          src={props.url}
          alt={props.caption}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalHeight > 0) setShape(naturalWidth / naturalHeight);
          }}
        />
      )}
      {props.pins.map((...[pin, index]) => (
        <span
          key={pin.id}
          className="pin"
          style={{
            left: `${String(pin.x * 100)}%`,
            top: `${String(pin.y * 100)}%`,
          }}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
}
