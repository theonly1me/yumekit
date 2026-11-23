import type { ReactNode } from "react";

const dotCount = 3;
const bounceSeconds = 0.6;

export function TypingDots(props: {
  frame: number;
  framesPerSecond: number;
  color: string;
  sizePixels: string;
  opacity: number;
}): ReactNode {
  const seconds = props.frame / props.framesPerSecond;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: "50%",
        display: "flex",
        gap: `calc(${props.sizePixels} * 0.6)`,
        transform: "translateY(-50%)",
        opacity: props.opacity,
      }}
    >
      {Array.from({ length: dotCount }, (...[, index]) => {
        const phase = (seconds / bounceSeconds - index * 0.18) * 2 * Math.PI;
        const lift = Math.max(0, Math.sin(phase));
        return (
          <span
            key={index}
            style={{
              width: props.sizePixels,
              height: props.sizePixels,
              borderRadius: "50%",
              background: props.color,
              opacity: 0.45 + 0.55 * lift,
              transform: `translateY(calc(${props.sizePixels} * ${String(-0.6 * lift)}))`,
            }}
          />
        );
      })}
    </span>
  );
}
