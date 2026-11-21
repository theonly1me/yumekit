import { useCallback, useEffect, useMemo, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { callInOrder } from "../sceneCalls.js";

export type HistoryStep = "undo" | "redo";

export interface History {
  step: (step: HistoryStep) => void;
  message: string | undefined;
}

const nonTextInputTypes = new Set(["checkbox", "radio", "range", "button"]);

function isTextField(target: EventTarget | null): target is HTMLElement {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return (
    target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type)
  );
}

function stepOfKey(event: KeyboardEvent): HistoryStep | undefined {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return undefined;
  if (event.key.toLowerCase() !== "z") return undefined;
  return event.shiftKey ? "redo" : "undo";
}

export function useHistory(options: {
  client: EngineClient;
  isActive: boolean;
}): History {
  const { client, isActive } = options;
  const [message, setMessage] = useState<string>();

  const step = useCallback(
    (step: HistoryStep) => {
      setMessage(undefined);
      callInOrder({ client, name: step, input: {} })
        .then((outcome) => {
          setMessage(outcome.kind === "done" ? undefined : outcome.message);
        })
        .catch((error: unknown) => {
          setMessage(String(error));
        });
    },
    [client],
  );

  useEffect(() => {
    if (!isActive) return;
    const typedSinceFocus = new WeakSet<EventTarget>();
    const onFocus = (event: FocusEvent) => {
      if (event.target !== null) typedSinceFocus.delete(event.target);
    };
    const onInput = (event: Event) => {
      if (isTextField(event.target)) typedSinceFocus.add(event.target);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const wanted = stepOfKey(event);
      if (wanted === undefined) return;
      if (event.target !== null && typedSinceFocus.has(event.target)) return;
      event.preventDefault();
      if (!event.repeat) step(wanted);
    };
    window.addEventListener("focusin", onFocus);
    window.addEventListener("input", onInput, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("focusin", onFocus);
      window.removeEventListener("input", onInput, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isActive, step]);

  return useMemo(() => ({ step, message }), [step, message]);
}
