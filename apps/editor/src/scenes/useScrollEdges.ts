import { useEffect, useState, type RefObject } from "react";

export interface ScrollEdges {
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
}

const edgeSlack = 2;

function edgesOf(element: HTMLElement): ScrollEdges {
  const { scrollLeft, scrollWidth, clientWidth } = element;
  return {
    hasMoreBefore: scrollLeft > edgeSlack,
    hasMoreAfter: scrollLeft + clientWidth < scrollWidth - edgeSlack,
  };
}

export function useScrollEdges(options: {
  element: RefObject<HTMLElement | null>;
  contentKey: string;
}): ScrollEdges {
  const { element, contentKey } = options;
  const [edges, setEdges] = useState<ScrollEdges>({
    hasMoreBefore: false,
    hasMoreAfter: false,
  });

  useEffect(() => {
    const current = element.current;
    if (current === null) return;
    const measure = () => {
      const next = edgesOf(current);
      setEdges((previous) =>
        previous.hasMoreBefore === next.hasMoreBefore &&
        previous.hasMoreAfter === next.hasMoreAfter
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(current);
    current.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      current.removeEventListener("scroll", measure);
    };
  }, [element, contentKey]);

  return edges;
}
