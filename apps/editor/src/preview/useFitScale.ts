import { useCallback, useEffect, useState } from "react";

function contentBoxOf(element: HTMLElement): { width: number; height: number } {
  const style = window.getComputedStyle(element);
  const horizontal =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const vertical =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  return {
    width: Math.max(0, element.clientWidth - horizontal),
    height: Math.max(0, element.clientHeight - vertical),
  };
}

export function useFitScale(size: {
  widthPixels: number;
  heightPixels: number;
}) {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(0);
  const { widthPixels, heightPixels } = size;

  useEffect(() => {
    if (stage === null) return;
    const measure = () => {
      const box = contentBoxOf(stage);
      setScale(Math.min(box.width / widthPixels, box.height / heightPixels));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => {
      observer.disconnect();
    };
  }, [stage, widthPixels, heightPixels]);

  const stageRef = useCallback((element: HTMLElement | null) => {
    setStage(element);
  }, []);

  return { stageRef, scale };
}
