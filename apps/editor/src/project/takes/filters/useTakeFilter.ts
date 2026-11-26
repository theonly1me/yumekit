import { useState } from "react";
import type { ItemDraft } from "../review/itemDrafts.js";
import type { ShownItem } from "../shownItems.js";
import { filterIds, isShownBy, type FilterId } from "./reviewFilters.js";

interface FilterState {
  id: FilterId;
  keptIds: ReadonlySet<string>;
}

export function useTakeFilter(options: {
  items: readonly ShownItem[];
  draftOf: (itemId: string) => ItemDraft;
  inUseIds: ReadonlySet<string>;
}) {
  const [state, setState] = useState<FilterState>({
    id: "all",
    keptIds: new Set(),
  });
  const matchesOf = (filter: FilterId): string[] =>
    options.items
      .filter((shown) =>
        isShownBy({
          filter,
          shown,
          draft: options.draftOf(shown.item.id),
          inUseIds: options.inUseIds,
        }),
      )
      .map((shown) => shown.item.id);
  const counts: Record<FilterId, number> = {
    all: 0,
    open: 0,
    mistakes: 0,
    "in-use": 0,
    new: 0,
  };
  for (const id of filterIds) counts[id] = matchesOf(id).length;
  const matching = new Set(matchesOf(state.id));
  return {
    picked: state.id,
    counts,
    shown: options.items.filter(
      (shown) =>
        matching.has(shown.item.id) || state.keptIds.has(shown.item.id),
    ),
    pick: (id: FilterId) => {
      setState({ id, keptIds: new Set(matchesOf(id)) });
    },
  };
}
