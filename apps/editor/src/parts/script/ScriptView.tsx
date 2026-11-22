import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { sendFixedRequest } from "../fixedRequests.js";
import { saveFile } from "../frame/saveFile.js";
import { notSentText, type StepViewProps } from "../frame/stepViewProps.js";
import { ScriptStatusLine } from "./ScriptStatusLine.js";
import { ScriptTools } from "./ScriptTools.js";
import { useScriptSaves } from "./useScriptSaves.js";
import "./script.css";

const pageAttributes = {
  class: "script-page",
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": "The script of the video",
  spellcheck: "false",
};

export function ScriptView(props: StepViewProps) {
  const { client, snapshot, locked } = props;
  const saves = useScriptSaves({
    client,
    storedScript: snapshot.script,
    revision: snapshot.revision,
  });
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: snapshot.script,
    contentType: "markdown",
    editable: !locked,
    editorProps: { attributes: pageAttributes },
    onUpdate: ({ editor: changed }) => {
      saves.change(changed.getMarkdown());
    },
  });

  useEffect(() => {
    editor.setEditable(!locked, false);
  }, [editor, locked]);

  const { revision, script } = snapshot;
  useEffect(() => {
    if (saves.isWaiting() || saves.isOwnRevision(revision)) return;
    if (editor.getMarkdown() === script) return;
    editor.commands.setContent(script, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, saves, revision, script]);

  return (
    <>
      <ScriptTools
        editor={editor}
        locked={locked}
        onDownload={() => {
          saveFile({
            blob: new Blob([editor.getMarkdown()], { type: "text/markdown" }),
            fileName: "script.md",
          });
        }}
      />
      {snapshot.script === "" ? (
        <p className="fact">
          The script is empty. You can type it here, or ask the AI to write it.
        </p>
      ) : undefined}
      <EditorContent editor={editor} />
      <ScriptStatusLine
        status={saves.status}
        locked={locked}
        onUpdate={() => {
          saves.flush();
          sendFixedRequest({
            ask: props.ask,
            request: { kind: "update-the-video" },
          })
            .then((isSent) => {
              if (isSent) saves.markAsked();
              else saves.markRefused(notSentText);
            })
            .catch(() => undefined);
        }}
        onUndo={() => {
          saves.undoMine().catch(() => undefined);
        }}
      />
    </>
  );
}
