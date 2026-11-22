import type { CSSProperties, ReactNode } from "react";
import { typed } from "../../motion/index.js";

export function TypedText(props: {
  text: string;
  textProp: string;
  frame: number;
  framesPerSecond: number;
  startFrame: number;
  charactersPerSecond: number;
  showCursor: boolean;
  cursorColor: string;
  wrapperStyle: CSSProperties;
  bubbleStyle: CSSProperties;
}): ReactNode {
  const typing = typed({
    text: props.text,
    frame: props.frame,
    framesPerSecond: props.framesPerSecond,
    startFrame: props.startFrame,
    charactersPerSecond: props.charactersPerSecond,
  });
  return (
    <div style={{ display: "grid", ...props.wrapperStyle }}>
      <p
        aria-hidden="true"
        style={{
          ...props.bubbleStyle,
          gridArea: "1 / 1",
          visibility: "hidden",
          opacity: 1,
          transform: "none",
        }}
      >
        {props.text}
      </p>
      <p
        data-text-prop={props.textProp}
        style={{
          ...props.bubbleStyle,
          gridArea: "1 / 1",
          justifySelf: "end",
          alignSelf: "start",
          maxWidth: "100%",
        }}
      >
        {typing.done ? props.text : typing.shown}
        {props.showCursor ? (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 0,
              height: "1.05em",
              verticalAlign: "-0.18em",
              borderLeft: `0.09em solid ${props.cursorColor}`,
              marginRight: "-0.09em",
              opacity: typing.cursorVisible ? 1 : 0,
            }}
          />
        ) : null}
      </p>
    </div>
  );
}
