import { useState } from "react";

export type BarViewId = "story" | "script" | "pictures" | "cast" | "files";

const barViews: { id: BarViewId; label: string }[] = [
  { id: "story", label: "Story" },
  { id: "script", label: "Script" },
  { id: "pictures", label: "Pictures" },
  { id: "cast", label: "Cast" },
  { id: "files", label: "Files" },
];

function Buttons(props: { onView: (viewId: BarViewId) => void }) {
  return barViews.map((view) => (
    <button
      key={view.id}
      type="button"
      onClick={() => {
        props.onView(view.id);
      }}
    >
      {view.label}
    </button>
  ));
}

export function ViewButtons(props: { onView: (viewId: BarViewId) => void }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <div className="bar-views">
        <Buttons onView={props.onView} />
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
