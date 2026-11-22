import { useEffect, useRef } from "react";

const textFieldSelector =
  '.kit-form input[type="text"], .kit-form textarea, .kit-form input:not([type])';
const longestWaitFrames = 120;

export function useFirstTextFocus(options: {
  request: number;
  hasForm: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const { request, hasForm } = options;

  useEffect(() => {
    if (request === 0) return;
    let animation = 0;
    let waited = 0;
    const tryFocus = () => {
      const root = panel.current;
      const field =
        root?.querySelector<HTMLElement>(textFieldSelector) ??
        (hasForm && waited < longestWaitFrames
          ? undefined
          : root?.querySelector<HTMLElement>(".scene-name"));
      if (field === undefined || field === null) {
        waited += 1;
        animation = window.requestAnimationFrame(tryFocus);
        return;
      }
      field.focus();
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.select();
      }
    };
    tryFocus();
    return () => {
      window.cancelAnimationFrame(animation);
    };
  }, [request, hasForm]);

  return panel;
}
