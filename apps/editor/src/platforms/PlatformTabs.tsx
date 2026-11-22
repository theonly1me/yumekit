import { useState } from "react";
import type { Output } from "../engine/snapshot.js";
import { AddPlatformMenu } from "./AddPlatformMenu.js";
import type { PlatformTab } from "./platformTabFacts.js";

export function PlatformTabs(props: {
  tabs: PlatformTab[];
  activeKey: string;
  outputs: Output[];
  failure: string | undefined;
  onTab: (key: string) => void;
  onAdd: (platformId: string) => void;
  onRemove: (platformId: string) => void;
}) {
  const [isAdding, setAdding] = useState(false);
  return (
    <div className="platform-tabs">
      <div className="platform-tab-list" role="tablist" aria-label="Platforms">
        {props.tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab.key === props.activeKey}
            aria-controls="preview-area"
            onClick={() => {
              props.onTab(tab.key);
            }}
          >
            {tab.name} <span>{tab.shape}</span>
          </button>
        ))}
      </div>
      {isAdding ? (
        <AddPlatformMenu
          outputs={props.outputs}
          onAdd={(platformId) => {
            setAdding(false);
            props.onAdd(platformId);
          }}
          onRemove={props.onRemove}
          onClose={() => {
            setAdding(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="tab add"
          aria-expanded={false}
          onClick={() => {
            setAdding(true);
          }}
        >
          Add a platform
        </button>
      )}
      {props.failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {props.failure}
        </p>
      )}
    </div>
  );
}
