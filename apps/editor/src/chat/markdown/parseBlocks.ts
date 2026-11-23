import { parseInline, type Inline } from "./parseInline.js";

export type Block =
  | { kind: "paragraph"; lines: Inline[][] }
  | { kind: "heading"; content: Inline[] }
  | { kind: "list"; ordered: boolean; start: number; items: Inline[][] };

const bulletPattern = /^\s{0,3}[-*+]\s+(.*)$/;
const numberPattern = /^\s{0,3}(\d{1,9})[.)]\s+(.*)$/;
const headingPattern = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;

type Line =
  | { kind: "blank" }
  | { kind: "text"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "item"; ordered: boolean; number: number; text: string };

function lineOf(raw: string): Line {
  if (raw.trim() === "") return { kind: "blank" };
  const heading = headingPattern.exec(raw);
  if (heading !== null) return { kind: "heading", text: heading[1] ?? "" };
  const bullet = bulletPattern.exec(raw);
  if (bullet !== null) {
    return { kind: "item", ordered: false, number: 1, text: bullet[1] ?? "" };
  }
  const numbered = numberPattern.exec(raw);
  if (numbered !== null) {
    return {
      kind: "item",
      ordered: true,
      number: Number(numbered[1]),
      text: numbered[2] ?? "",
    };
  }
  return { kind: "text", text: raw.trim() };
}

function addLine(options: {
  blocks: Block[];
  line: Line;
  isAfterBlank: boolean;
}) {
  const { blocks, line } = options;
  const last = blocks.at(-1);
  switch (line.kind) {
    case "blank":
      return;
    case "heading":
      blocks.push({ kind: "heading", content: parseInline(line.text) });
      return;
    case "item":
      if (last?.kind === "list" && last.ordered === line.ordered) {
        last.items.push(parseInline(line.text));
        return;
      }
      blocks.push({
        kind: "list",
        ordered: line.ordered,
        start: line.number,
        items: [parseInline(line.text)],
      });
      return;
    case "text":
      if (last?.kind === "paragraph" && !options.isAfterBlank) {
        last.lines.push(parseInline(line.text));
        return;
      }
      blocks.push({ kind: "paragraph", lines: [parseInline(line.text)] });
  }
}

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let isAfterBlank = true;
  for (const raw of text.replaceAll("\r\n", "\n").split("\n")) {
    const line = lineOf(raw);
    addLine({ blocks, line, isAfterBlank });
    isAfterBlank = line.kind === "blank";
  }
  return blocks;
}
