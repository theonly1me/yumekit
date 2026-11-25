import { useLayoutEffect, useRef, useState } from "react";
import {
  chatWidths,
  clampedWidth,
  forgetShownWidth,
  keyStepPixels,
  saveWidth,
  showWidth,
  storedWidth,
} from "./chatWidth.js";

const keySteps: Record<string, number> = {
  ArrowLeft: keyStepPixels,
  ArrowRight: -keyStepPixels,
};

interface Drag {
  startX: number;
  startWidth: number;
  width: number;
}

export function ChatEdge() {
  const [width, setWidth] = useState(storedWidth);
  const drag = useRef<Drag | undefined>(undefined);

  useLayoutEffect(() => {
    showWidth(width);
  }, [width]);

  useLayoutEffect(() => forgetShownWidth, []);

  const keep = (next: number) => {
    setWidth(next);
    showWidth(next);
    saveWidth(next);
  };

  return (
    <span
      className="chat-edge"
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      aria-label="Width of the chat. Drag, or use the arrow keys. Double click to reset."
      aria-valuemin={chatWidths.smallest}
      aria-valuemax={chatWidths.largest}
      aria-valuenow={width}
      title="Drag to make the chat wider or narrower. Double click to reset."
      onDoubleClick={() => {
        keep(chatWidths.standard);
      }}
      onKeyDown={(event) => {
        const step = keySteps[event.key];
        if (step === undefined) return;
        event.preventDefault();
        keep(clampedWidth(width + step));
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startWidth: width, width };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (current === undefined) return;
        current.width = clampedWidth(
          current.startWidth + current.startX - event.clientX,
        );
        showWidth(current.width);
      }}
      onPointerUp={() => {
        const current = drag.current;
        drag.current = undefined;
        if (current !== undefined) keep(current.width);
      }}
      onPointerCancel={() => {
        drag.current = undefined;
        showWidth(width);
      }}
    />
  );
}
