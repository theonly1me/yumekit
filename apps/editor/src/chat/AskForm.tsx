import { useEffect, useRef } from "react";
import type { ChatAgent } from "./chatSchemas.js";
import type { ChatBox } from "./useChatBox.js";
import "./askForm.css";

export interface SceneChip {
  clipId: string;
  label: string;
}

export const askBoxId = "ask-box";

function agentLineOf(agent: ChatAgent | null | undefined): string {
  if (agent === undefined) return "";
  if (agent === null) return "No AI is set up yet. Open Settings.";
  return agent.signIn === "signed-out"
    ? `${agent.name} on this computer is not signed in`
    : `${agent.name} on this computer`;
}

export function AskForm(props: {
  box: ChatBox;
  chip: SceneChip | undefined;
  agent: ChatAgent | null | undefined;
  isRunning: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onOpenAiSettings: () => void;
}) {
  const { box, chip } = props;
  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textArea.current;
    if (box.focusRequest === 0 || element === null) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [box.focusRequest]);

  const send = () => {
    if (props.isRunning || box.draft.trim() === "") return;
    props.onSend(box.draft.trim());
  };
  return (
    <form
      className="ask-form"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {chip === undefined ? undefined : (
        <span className="about-chip">
          {chip.label}
          <button
            type="button"
            aria-label="Ask about the full video"
            onClick={() => {
              box.removeChip(chip.clipId);
            }}
          >
            x
          </button>
        </span>
      )}
      <label htmlFor={askBoxId} className="hidden-label">
        Ask for a change
      </label>
      <textarea
        id={askBoxId}
        ref={textArea}
        rows={2}
        placeholder="Ask for a change"
        value={box.draft}
        onChange={(event) => {
          box.setDraft(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          if (event.nativeEvent.isComposing) return;
          event.preventDefault();
          send();
        }}
      />
      <div className="ask-foot">
        <button
          type="button"
          className="agent-line"
          onClick={props.onOpenAiSettings}
        >
          {agentLineOf(props.agent)}
        </button>
        {props.isRunning ? (
          <button type="button" onClick={props.onStop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="primary">
            Send
          </button>
        )}
      </div>
    </form>
  );
}
