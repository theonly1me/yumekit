import { useId, useLayoutEffect, useRef, useState } from "react";
import "./foldedText.css";

function isCutOff(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight + 1;
}

export function FoldedText(props: { className: string; text: string }) {
  const textId = useId();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [isLong, setLong] = useState(false);
  const isClosing = useRef(false);

  useLayoutEffect(() => {
    if (isOpen || !isClosing.current) return;
    isClosing.current = false;
    toggle.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen]);

  useLayoutEffect(() => {
    const element = paragraph.current;
    if (element === null || isOpen) return;
    const measure = () => {
      if (element.clientHeight > 0) setLong(isCutOff(element));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isOpen, props.text]);

  return (
    <div className={`folded ${props.className}`}>
      <p id={textId} ref={paragraph} data-folded={!isOpen}>
        {props.text}
      </p>
      {isLong ? (
        <button
          type="button"
          ref={toggle}
          className="link fold-toggle"
          aria-expanded={isOpen}
          aria-controls={textId}
          onClick={() => {
            isClosing.current = isOpen;
            setOpen(!isOpen);
          }}
        >
          {isOpen ? "Show less" : "Show all"}
        </button>
      ) : undefined}
    </div>
  );
}
