import { noteVerdictsOf } from "@yumekit/project/takes";
import type { Take } from "../takeTypes.js";
import type { ItemDraft } from "./itemDrafts.js";

export function sentDraftOf(options: {
  take: Take;
  itemId: string;
}): ItemDraft {
  const { take, itemId } = options;
  const own = take.notes.filter((note) => note.itemId === itemId);
  const verdict =
    noteVerdictsOf(own).get(itemId) ??
    (take.items.some((item) => item.id === itemId && item.approved === true)
      ? "approved"
      : undefined);
  const markId = (index: number) => `sent-${String(index)}`;
  const general = own.filter(
    (note) =>
      note.pin === undefined &&
      note.seconds === undefined &&
      note.quote === undefined,
  );
  return {
    ...(verdict === undefined ? {} : { verdict }),
    ...(own.some((note) => note.use === true) ? ({ use: true } as const) : {}),
    tags: [...new Set(general.flatMap((note) => note.tags ?? []))],
    note: general
      .map((note) => note.text)
      .filter((text) => text !== "")
      .join(" "),
    pins: own.flatMap((...[note, index]) =>
      note.pin === undefined
        ? []
        : [{ id: markId(index), ...note.pin, text: note.text }],
    ),
    moments: own.flatMap((...[note, index]) =>
      note.seconds === undefined
        ? []
        : [{ id: markId(index), seconds: note.seconds, text: note.text }],
    ),
    quotes: own.flatMap((...[note, index]) =>
      note.quote === undefined
        ? []
        : [{ id: markId(index), quote: note.quote, text: note.text }],
    ),
  };
}
