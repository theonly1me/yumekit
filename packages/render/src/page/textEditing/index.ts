import type { PreviewReply } from "../previewMessages.js";
import { editText } from "./editText.js";
import { currentTextElementOf, editableTextAttribute } from "./textProps.js";

export { markEditableTexts } from "./textProps.js";

const textEditingStyle = `
#stage * { pointer-events: none; }
#stage [${editableTextAttribute}] { pointer-events: auto; cursor: text; }
#stage [${editableTextAttribute}]:hover,
#stage [${editableTextAttribute}]:focus {
  outline: 0.3vmin dashed currentColor;
  outline-offset: 0.8vmin;
}
#stage [contenteditable],
#stage [contenteditable] *,
#stage :has([contenteditable]) {
  opacity: 1 !important;
  filter: none !important;
  clip-path: none !important;
}
#stage [contenteditable],
#stage [contenteditable] * {
  transform: none !important;
}`;

export function listenForTextEdits(options: {
  root: HTMLElement;
  enqueue: (work: () => Promise<void>) => void;
  reply: (message: PreviewReply) => void;
  redraw: () => Promise<void>;
}): void {
  const { root, enqueue, reply, redraw } = options;
  const style = document.createElement("style");
  style.textContent = textEditingStyle;
  document.head.append(style);
  root.addEventListener("click", (event) => {
    const element =
      event.target instanceof Element
        ? event.target.closest(`[${editableTextAttribute}]`)
        : null;
    if (!(element instanceof HTMLElement) || element.isContentEditable) {
      return;
    }
    reply({ type: "text-editing" });
    enqueue(async () => {
      const current = currentTextElementOf({ root, element });
      const outcome =
        current === undefined
          ? { kind: "not-editable" as const }
          : await editText(current);
      if (outcome.kind === "saved") {
        reply({
          type: "text-changed",
          sceneId: outcome.target.sceneId,
          path: outcome.target.path,
          text: outcome.text,
        });
      } else if (outcome.kind === "cancelled") {
        await redraw();
      }
    });
  });
}
