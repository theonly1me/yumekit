import type { ReactNode } from "react";

export type SideTab = "chat" | "scene";

export function SidePanel(props: {
  tab: SideTab;
  sceneLabel: string | undefined;
  onTab: (tab: SideTab) => void;
  children: ReactNode;
}) {
  const shown: SideTab =
    props.tab === "scene" && props.sceneLabel !== undefined ? "scene" : "chat";
  const tabs: { id: SideTab; label: string; isDisabled: boolean }[] = [
    { id: "chat", label: "Chat", isDisabled: false },
    {
      id: "scene",
      label: props.sceneLabel ?? "Scene",
      isDisabled: props.sceneLabel === undefined,
    },
  ];
  return (
    <aside className="side" aria-label="Chat and the picked scene">
      <div className="side-tabs" role="tablist" aria-label="Side panel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`side-tab-${tab.id}`}
            className="tab"
            aria-selected={tab.id === shown}
            aria-controls="side-body"
            disabled={tab.isDisabled}
            onClick={() => {
              props.onTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="side-body"
        id="side-body"
        role="tabpanel"
        aria-labelledby={`side-tab-${shown}`}
        data-tab={shown}
      >
        {props.children}
      </div>
    </aside>
  );
}
