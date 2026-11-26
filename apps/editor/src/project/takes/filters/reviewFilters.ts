import { verdictOfDraft, type ItemDraft } from "../review/itemDrafts.js";
import type { ShownItem } from "../shownItems.js";

export const filterIds = ["all", "open", "mistakes", "in-use", "new"] as const;

export type FilterId = (typeof filterIds)[number];

export const filterNames: Record<FilterId, string> = {
  all: "All",
  open: "Not reviewed",
  mistakes: "Has mistakes",
  "in-use": "In use",
  new: "New in this take",
};

export function isShownBy(options: {
  filter: FilterId;
  shown: ShownItem;
  draft: ItemDraft;
  inUseIds: ReadonlySet<string>;
}): boolean {
  const { shown } = options;
  switch (options.filter) {
    case "all":
      return true;
    case "open":
      return verdictOfDraft(options.draft) === undefined;
    case "mistakes":
      return verdictOfDraft(options.draft) === "change";
    case "in-use":
      return options.inUseIds.has(shown.item.id);
    case "new":
      return shown.origin === "new";
  }
}
