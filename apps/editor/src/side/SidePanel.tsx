import type { ReactNode } from "react";

export type SideTab = "agent" | "scene" | "tools";

const tabs: { id: SideTab; label: string }[] = [
  { id: "agent", label: "Agent" },
  { id: "scene", label: "Scene" },
  { id: "tools", label: "Tools" },
];

export function SidePanel(props: {
  tab: SideTab;
  onTab: (tab: SideTab) => void;
  children: ReactNode;
}) {
  return (
    <aside className="side" aria-label="Agent, scene, and tools">
      <div className="side-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="tab"
            aria-pressed={tab.id === props.tab}
            onClick={() => {
              props.onTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="side-pane" data-pane={props.tab}>
        {props.children}
      </div>
    </aside>
  );
}
