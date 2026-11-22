import type { CSSProperties, ReactNode } from "react";

const visibleShare = 0.02;

export function CheckMark(props: {
  share: number;
  color: string;
  style?: CSSProperties;
}): ReactNode {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{
        display: "block",
        overflow: "visible",
        opacity: props.share > visibleShare ? 1 : 0,
        ...props.style,
      }}
    >
      <path
        d="M5 12.5 L10 17.5 L19.5 7"
        pathLength={1}
        fill="none"
        stroke={props.color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - Math.min(1, Math.max(0, props.share))}
      />
    </svg>
  );
}

export function CrossMark(props: {
  color: string;
  style?: CSSProperties;
}): ReactNode {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ display: "block", overflow: "visible", ...props.style }}
    >
      <path
        d="M7 7 L17 17 M17 7 L7 17"
        fill="none"
        stroke={props.color}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
