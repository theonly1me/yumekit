import { useLayoutEffect, useRef, type RefObject } from "react";

function fitHeight(element: HTMLTextAreaElement): void {
  element.style.height = "auto";
  element.style.height = `${String(element.scrollHeight)}px`;
}

export function useFitHeight(options: {
  element: RefObject<HTMLTextAreaElement | null>;
  text: string;
}): void {
  const { element, text } = options;
  const measuredWidth = useRef(0);

  useLayoutEffect(() => {
    const textArea = element.current;
    if (textArea === null || textArea.clientWidth === 0) return;
    fitHeight(textArea);
  }, [element, text]);

  useLayoutEffect(() => {
    const textArea = element.current;
    if (textArea === null) return;
    const observer = new ResizeObserver(() => {
      if (textArea.clientWidth === measuredWidth.current) return;
      measuredWidth.current = textArea.clientWidth;
      if (textArea.clientWidth > 0) fitHeight(textArea);
    });
    observer.observe(textArea);
    return () => {
      observer.disconnect();
    };
  }, [element]);
}
