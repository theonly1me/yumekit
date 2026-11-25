import { useEffect, useRef } from "react";
import { useFitHeight } from "./useFitHeight.js";
import type { ChatAgent } from "./chatSchemas.js";
import {
  AddFilesButton,
  DropHint,
  FileChips,
  type PendingFiles,
} from "./files/index.js";
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
  files: PendingFiles;
  isDragging: boolean;
  chip: SceneChip | undefined;
  agent: ChatAgent | null | undefined;
  isRunning: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onOpenAiSettings: () => void;
}) {
  const { box, chip, files } = props;
  const textArea = useRef<HTMLTextAreaElement>(null);
  useFitHeight({ element: textArea, text: box.draft });

  useEffect(() => {
    const element = textArea.current;
    if (box.focusRequest === 0 || element === null) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [box.focusRequest]);

  const send = () => {
    if (files.isAdding) return;
    if (box.draft.trim() === "" && files.items.length === 0) return;
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
        placeholder={
          props.isRunning
            ? "Tell the AI something while it works"
            : "Ask for a change, or drop files here"
        }
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
      <FileChips files={files.items} onRemove={files.remove} />
      <div className="ask-foot">
        <AddFilesButton onFiles={files.add} />
        <button
          type="button"
          className="agent-line"
          onClick={props.onOpenAiSettings}
        >
          {agentLineOf(props.agent)}
        </button>
        <span className="ask-buttons">
          {props.isRunning ? (
            <>
              <button type="submit" disabled={files.isAdding}>
                Send
              </button>
              <button type="button" onClick={props.onStop}>
                Stop
              </button>
            </>
          ) : (
            <button type="submit" className="primary" disabled={files.isAdding}>
              Send
            </button>
          )}
        </span>
      </div>
      <DropHint isShown={props.isDragging} />
    </form>
  );
}
