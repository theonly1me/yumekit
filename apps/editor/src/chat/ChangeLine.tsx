import { useEffect, useRef, useState } from "react";
import type { ChangeEntry } from "./chatSchemas.js";

function laterText(count: number): string {
  return count === 1
    ? "This also undoes 1 later change."
    : `This also undoes ${String(count)} later changes.`;
}

export function ChangeLine(props: {
  change: ChangeEntry;
  laterCount: number;
  isBusy: boolean;
  onUndo: () => Promise<string | undefined>;
}) {
  const { change, laterCount } = props;
  const [isAsking, setAsking] = useState(false);
  const [failure, setFailure] = useState<string>();
  const confirm = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAsking) confirm.current?.scrollIntoView({ block: "nearest" });
  }, [isAsking]);

  const undo = () => {
    setAsking(false);
    props.onUndo().then(setFailure, (error: unknown) => {
      setFailure(String(error));
    });
  };
  const canUndo = !change.undone && change.undoSteps > 0;
  return (
    <li className="entry change" data-undone={change.undone}>
      <p>{change.summary}</p>
      {change.undone ? (
        <span className="fact">Undone</span>
      ) : canUndo ? (
        <button
          type="button"
          className="link"
          disabled={props.isBusy}
          onClick={() => {
            if (laterCount === 0) undo();
            else setAsking(true);
          }}
        >
          Undo
        </button>
      ) : undefined}
      {isAsking ? (
        <div
          className="undo-confirm"
          role="group"
          aria-label="Undo the change"
          ref={confirm}
        >
          <p>{laterText(laterCount)}</p>
          <button type="button" className="primary" onClick={undo}>
            Undo them
          </button>
          <button
            type="button"
            onClick={() => {
              setAsking(false);
            }}
          >
            Cancel
          </button>
        </div>
      ) : undefined}
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
    </li>
  );
}
