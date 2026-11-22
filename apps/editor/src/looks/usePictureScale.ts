import { useEffect, useRef, useState } from "react";

export function usePictureScale(widthPixels: number) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setScale(entry.contentRect.width / widthPixels);
      }
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
    };
  }, [widthPixels]);

  return { frameRef, scale };
}
