import { useEffect, useRef, useState } from "react";

export function useElementWidth<Shown extends HTMLElement>() {
  const elementRef = useRef<Shown>(null);
  const [widthPixels, setWidthPixels] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (element === null) return;
    setWidthPixels(element.clientWidth);
    const observer = new ResizeObserver(() => {
      setWidthPixels(element.clientWidth);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { elementRef, widthPixels };
}
