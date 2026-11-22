import { useLayoutEffect, useRef, type ReactNode } from "react";

export function PaintedCanvas(props: {
  widthPixels: number;
  heightPixels: number;
  paint: (context: CanvasRenderingContext2D) => void;
  paintKey: string;
}): ReactNode {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const paintedKeyReference = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    const canvas = canvasReference.current;
    const paintKey = `${String(props.widthPixels)}x${String(props.heightPixels)}:${props.paintKey}`;
    if (canvas === null || paintedKeyReference.current === paintKey) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context !== null) {
      paintedKeyReference.current = paintKey;
      context.clearRect(0, 0, props.widthPixels, props.heightPixels);
      props.paint(context);
    }
  });
  return (
    <canvas
      ref={canvasReference}
      width={props.widthPixels}
      height={props.heightPixels}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
