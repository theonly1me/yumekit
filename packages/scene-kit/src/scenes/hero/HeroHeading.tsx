import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { MotionWord } from "../../motion/index.js";
import type { WordRange } from "./accentRange.js";

function isSettled(word: MotionWord): boolean {
  return word.style.opacity >= 1 && word.style.transform === "none";
}

function WordSpans(props: { words: MotionWord[]; offset: number }): ReactNode {
  if (props.words.every(isSettled)) {
    return props.words.map((word) => word.text).join(" ");
  }
  return [...props.words.entries()].map(([index, word]) => (
    <Fragment key={`${String(props.offset + index)}-${word.text}`}>
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
  ));
}

export function HeroHeading(props: {
  words: MotionWord[];
  accent: WordRange;
  accentStyle: CSSProperties;
}): ReactNode {
  const { words, accent } = props;
  const before = words.slice(0, accent.first);
  const accentWords = words.slice(accent.first, accent.last + 1);
  const after = words.slice(accent.last + 1);
  return (
    <>
      {before.length === 0 ? null : (
        <>
          <WordSpans words={before} offset={0} />{" "}
        </>
      )}
      <span style={props.accentStyle}>
        <WordSpans words={accentWords} offset={accent.first} />
      </span>
      {after.length === 0 ? null : (
        <>
          {" "}
          <WordSpans words={after} offset={accent.last + 1} />
        </>
      )}
    </>
  );
}
