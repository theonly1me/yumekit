import { Fragment, type ReactNode } from "react";
import type { MotionWord } from "../motion/index.js";

function isSettled(word: MotionWord): boolean {
  return word.style.opacity >= 1 && word.style.transform === "none";
}

export function MotionWords(props: {
  words: MotionWord[];
  settledAs: "text" | "word-spans";
}): ReactNode {
  if (props.settledAs === "text" && props.words.every(isSettled)) {
    return props.words.map((word) => word.text).join(" ");
  }
  return (
    <>
      {[...props.words.entries()].map(([index, word]) => (
        <Fragment key={`${String(index)}-${word.text}`}>
          {index === 0 ? null : " "}
          <span
            style={
              isSettled(word)
                ? { opacity: 1 }
                : { display: "inline-block", ...word.style }
            }
          >
            {word.text}
          </span>
        </Fragment>
      ))}
    </>
  );
}
