import type { TransitionChoice } from "./transitionChoices.js";

function shapesOf(kind: TransitionChoice) {
  switch (kind) {
    case "cut":
      return (
        <>
          <rect x="1.5" y="3.5" width="6" height="9" rx="1" />
          <rect x="8.5" y="3.5" width="6" height="9" rx="1" />
        </>
      );
    case "fade":
      return (
        <>
          <rect x="1.5" y="3.5" width="8" height="9" rx="1" />
          <rect
            x="6.5"
            y="3.5"
            width="8"
            height="9"
            rx="1"
            fill="currentColor"
            fillOpacity="0.35"
          />
        </>
      );
    case "slide":
      return (
        <>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
          <path d="M11 8H5M7 6 5 8l2 2" />
        </>
      );
    case "wipe":
      return (
        <>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
          <path
            d="M9.5 3.5h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4z"
            fill="currentColor"
            fillOpacity="0.35"
          />
          <path d="M9.5 2v12" />
        </>
      );
    case "zoom":
      return (
        <>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
          <rect x="5" y="6" width="6" height="4" rx="0.5" />
        </>
      );
  }
}

export function TransitionIcon(props: { kind: TransitionChoice }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapesOf(props.kind)}
    </svg>
  );
}
