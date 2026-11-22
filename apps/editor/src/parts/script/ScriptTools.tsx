import type { Editor } from "@tiptap/react";

type TextStyle = "bold" | "italic" | "heading" | "list";

const textStyles: { id: TextStyle; label: string }[] = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "heading", label: "Heading" },
  { id: "list", label: "List" },
];

function applyStyle(options: { editor: Editor; style: TextStyle }): void {
  const chain = options.editor.chain().focus();
  switch (options.style) {
    case "bold":
      chain.toggleBold().run();
      return;
    case "italic":
      chain.toggleItalic().run();
      return;
    case "heading":
      chain.toggleHeading({ level: 2 }).run();
      return;
    case "list":
      chain.toggleBulletList().run();
      return;
  }
}

export function ScriptTools(props: {
  editor: Editor;
  locked: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="script-tools" role="toolbar" aria-label="Text style">
      {textStyles.map((style) => (
        <button
          key={style.id}
          type="button"
          disabled={props.locked}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            applyStyle({ editor: props.editor, style: style.id });
          }}
        >
          {style.label}
        </button>
      ))}
      <button type="button" className="link" onClick={props.onDownload}>
        Download the script
      </button>
    </div>
  );
}
