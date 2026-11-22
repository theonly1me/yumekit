import { useEffect, useRef } from "react";
import type { Output } from "../engine/snapshot.js";
import { platformsOff, platformsOn } from "./platformTabFacts.js";

export function AddPlatformMenu(props: {
  outputs: Output[];
  onAdd: (platformId: string) => void;
  onRemove: (platformId: string) => void;
  onClose: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const off = platformsOff(props.outputs);
  const on = platformsOn(props.outputs);

  useEffect(() => {
    menu.current?.querySelector("button")?.focus();
  }, []);

  return (
    <div
      ref={menu}
      className="add-menu"
      role="group"
      aria-label="Add a platform"
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose();
      }}
    >
      {off.map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => {
            props.onAdd(platform.id);
          }}
        >
          {platform.name} <span>{platform.shape}</span>
        </button>
      ))}
      {off.length === 0 ? (
        <p className="fact">The project has each platform.</p>
      ) : undefined}
      <button type="button" className="link" onClick={props.onClose}>
        Close
      </button>
      {on.length === 0 ? undefined : (
        <p className="remove-platforms">
          {on.map((platform) => (
            <button
              key={platform.id}
              type="button"
              className="quiet"
              onClick={() => {
                props.onRemove(platform.id);
              }}
            >
              Remove {platform.name}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
