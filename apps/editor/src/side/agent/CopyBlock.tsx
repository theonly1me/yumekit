import { useEffect, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const resetMilliseconds = 2_000;

export function CopyBlock(props: { text: string; copyLabel: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => {
      setState("idle");
    }, resetMilliseconds);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state]);

  const copy = () => {
    navigator.clipboard.writeText(props.text).then(
      () => {
        setState("copied");
      },
      () => {
        setState("failed");
      },
    );
  };

  return (
    <>
      <pre className="config">{props.text}</pre>
      <div className="copy-row">
        <button type="button" onClick={copy}>
          {props.copyLabel}
        </button>
        <p className="fact" role="status">
          {state === "copied" ? "Copied." : undefined}
          {state === "failed"
            ? "The browser did not allow the copy. Select the text and copy it."
            : undefined}
        </p>
      </div>
    </>
  );
}
