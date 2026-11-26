import { useState } from "react";

export type BarViewId =
  "project" | "takes" | "story" | "script" | "pictures" | "cast" | "files";

const barViews: { id: BarViewId; label: string }[] = [
  { id: "project", label: "Back to the project" },
  { id: "takes", label: "Takes" },
  { id: "story", label: "Story" },
  { id: "script", label: "Script" },
  { id: "pictures", label: "Pictures" },
  { id: "cast", label: "Cast" },
  { id: "files", label: "Files" },
];

function Buttons(props: {
  takesCount: number;
  onView: (viewId: BarViewId) => void;
}) {
  return barViews.map((view) => (
    <button
      key={view.id}
      type="button"
      onClick={() => {
        props.onView(view.id);
      }}
    >
      {view.label}
      {view.id === "takes" && props.takesCount > 0 ? (
        <span className="takes-count"> {props.takesCount}</span>
      ) : undefined}
    </button>
  ));
}

export function ViewButtons(props: {
  takesCount: number;
  onView: (viewId: BarViewId) => void;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <div className="bar-views">
        <Buttons takesCount={props.takesCount} onView={props.onView} />
      </div>
      <div
        className="bar-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="bar-menu-list"
          onClick={() => {
            setOpen(!isOpen);
          }}
        >
          Open
        </button>
        {isOpen ? (
          <div
            id="bar-menu-list"
            className="bar-menu-list"
            role="group"
            aria-label="Open a view"
          >
            <Buttons
              takesCount={props.takesCount}
              onView={(viewId) => {
                setOpen(false);
                props.onView(viewId);
              }}
            />
          </div>
        ) : undefined}
      </div>
    </>
  );
}
