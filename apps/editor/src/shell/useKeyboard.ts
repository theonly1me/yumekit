import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) {
    return true;
  }
  return target instanceof HTMLInputElement && target.type !== "range";
}

function isRangeTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === "range";
}

export function useKeyboard(options: {
  isActive: boolean;
  onToggle: () => void;
  onStep: (frames: number) => void;
}) {
  const { isActive, onToggle, onStep } = options;

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        isTypingTarget(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat) onToggle();
        return;
      }
      if (isRangeTarget(event.target)) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        onStep(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " " && !isTypingTarget(event.target)) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isActive, onToggle, onStep]);
}
