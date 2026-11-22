import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { fitVariable } from "./sizes.js";

const largestFitSteps = 30;
const smallestShrink = 0.5;
const largestShrink = 0.96;

function overflows(options: {
  box: HTMLElement;
  content: HTMLElement;
}): boolean {
  const { box, content } = options;
  return (
    content.offsetHeight > box.clientHeight ||
    content.scrollWidth > box.clientWidth
  );
}

function fitContent(options: { box: HTMLElement; content: HTMLElement }) {
  const { box, content } = options;
  let fit = 1;
  box.style.setProperty(fitVariable, String(fit));
  for (
    let step = 0;
    step < largestFitSteps && overflows({ box, content });
    step += 1
  ) {
    const ratio = Math.min(
      box.clientHeight / Math.max(1, content.offsetHeight),
      box.clientWidth / Math.max(1, content.scrollWidth),
    );
    fit *= Math.min(largestShrink, Math.max(smallestShrink, ratio));
    box.style.setProperty(fitVariable, String(fit));
  }
}

export function FitBox(props: {
  style: CSSProperties;
  contentStyle?: CSSProperties;
  leadingSpace?: string;
  children: ReactNode;
}): ReactNode {
  const boxReference = useRef<HTMLDivElement>(null);
  const contentReference = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = boxReference.current;
    const content = contentReference.current;
    if (box !== null && content !== null) {
      fitContent({ box, content });
    }
  });
  return (
    <div
      ref={boxReference}
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        ...props.style,
      }}
    >
      {props.leadingSpace === undefined ? null : (
        <div aria-hidden="true" style={{ flex: `0 1 ${props.leadingSpace}` }} />
      )}
      <div
        ref={contentReference}
        style={{ flexShrink: 0, maxWidth: "100%", ...props.contentStyle }}
      >
        {props.children}
      </div>
    </div>
  );
}
