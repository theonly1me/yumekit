import type { ReactNode } from "react";
import { parseBlocks, type Block } from "./parseBlocks.js";
import type { Inline } from "./parseInline.js";
import "./markdown.css";

function inlineNodes(inlines: Inline[]): ReactNode[] {
  return inlines.map((...[inline, index]) => {
    switch (inline.kind) {
      case "text":
        return inline.text;
      case "code":
        return <code key={index}>{inline.text}</code>;
      case "strong":
        return <strong key={index}>{inlineNodes(inline.children)}</strong>;
      case "emphasis":
        return <em key={index}>{inlineNodes(inline.children)}</em>;
    }
  });
}

function blockNode(options: { block: Block; index: number }): ReactNode {
  const { block, index } = options;
  switch (block.kind) {
    case "heading":
      return (
        <p key={index} className="markdown-heading">
          <strong>{inlineNodes(block.content)}</strong>
        </p>
      );
    case "paragraph":
      return (
        <p key={index}>
          {block.lines.map((...[line, lineIndex]) => (
            <span key={lineIndex}>
              {lineIndex === 0 ? undefined : <br />}
              {inlineNodes(line)}
            </span>
          ))}
        </p>
      );
    case "list": {
      const items = block.items.map((...[item, itemIndex]) => (
        <li key={itemIndex}>{inlineNodes(item)}</li>
      ));
      return block.ordered ? (
        <ol key={index} start={block.start}>
          {items}
        </ol>
      ) : (
        <ul key={index}>{items}</ul>
      );
    }
  }
}

export function MarkdownText(props: { text: string; className?: string }) {
  return (
    <div className={props.className}>
      {parseBlocks(props.text).map((...[block, index]) =>
        blockNode({ block, index }),
      )}
    </div>
  );
}
