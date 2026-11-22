import { textTargetOf, type TextTarget } from "./textProps.js";

export type TextEditOutcome =
  | { kind: "saved"; target: TextTarget; text: string }
  | { kind: "cancelled" }
  | { kind: "not-editable" };

function plainTextOf(element: HTMLElement): string {
  return element.textContent.replace(/\s+/g, " ").trim();
}

function selectText(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function editText(element: HTMLElement): Promise<TextEditOutcome> {
  const target = textTargetOf(element);
  if (target === undefined || !element.isConnected) {
    return Promise.resolve({ kind: "not-editable" });
  }
  const before = plainTextOf(element);
  element.contentEditable = "plaintext-only";
  element.spellcheck = false;
  element.focus();
  selectText(element);
  return new Promise((resolve) => {
    const finish = (isSave: boolean) => {
      element.removeEventListener("keydown", onKey);
      element.removeEventListener("blur", onBlur);
      element.removeAttribute("contenteditable");
      window.getSelection()?.removeAllRanges();
      const text = plainTextOf(element);
      resolve(
        isSave && text !== "" && text !== before
          ? { kind: "saved", target, text }
          : { kind: "cancelled" },
      );
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        finish(event.key === "Enter");
      }
    };
    const onBlur = () => {
      finish(true);
    };
    element.addEventListener("keydown", onKey);
    element.addEventListener("blur", onBlur);
  });
}
