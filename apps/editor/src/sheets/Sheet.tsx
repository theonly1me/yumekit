import { useEffect, useRef, type ReactNode } from "react";
import "./sheets.css";

export function Sheet(props: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={props.titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose();
      }}
    >
      <button
        ref={closeButton}
        type="button"
        className="sheet-close"
        onClick={props.onClose}
      >
        Close
      </button>
      <div className="sheet-content">{props.children}</div>
    </div>
  );
}
