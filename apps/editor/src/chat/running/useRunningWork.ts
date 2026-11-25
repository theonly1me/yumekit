import { useEffect, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { workListSchema, type WorkItem } from "./workSchema.js";

export function useRunningWork(client: EngineClient): WorkItem[] {
  const [items, setItems] = useState<WorkItem[]>([]);
  const load = () => {
    client.readJson({ path: "/api/work", schema: workListSchema }).then(
      (listed) => {
        if (listed.ok) setItems(listed.value.items);
      },
      () => undefined,
    );
  };
  useEffect(load, [client]);
  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type === "work-changed") setItems(event.items);
      if (event.type === "connection-opened") load();
    },
  });
  return items;
}
