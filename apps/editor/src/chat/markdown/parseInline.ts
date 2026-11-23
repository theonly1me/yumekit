export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "emphasis"; children: Inline[] }
  | { kind: "code"; text: string };

interface Mark {
  pattern: RegExp;
  build: (match: RegExpExecArray) => Inline;
}

const marks: Mark[] = [
  {
    pattern: /`([^`\n]+)`/,
    build: (match) => ({ kind: "code", text: match[1] ?? "" }),
  },
  {
    pattern: /\*\*(?=\S)(.+?)(?<=\S)\*\*/,
    build: (match) => ({
      kind: "strong",
      children: parseInline(match[1] ?? ""),
    }),
  },
  {
    pattern: /(?<![\p{L}\p{N}])__(?=\S)(.+?)(?<=\S)__(?![\p{L}\p{N}])/u,
    build: (match) => ({
      kind: "strong",
      children: parseInline(match[1] ?? ""),
    }),
  },
  {
    pattern: /\*(?=[^\s*])(.+?)(?<=[^\s*])\*/,
    build: (match) => ({
      kind: "emphasis",
      children: parseInline(match[1] ?? ""),
    }),
  },
  {
    pattern: /(?<![\p{L}\p{N}_])_(?=[^\s_])(.+?)(?<=[^\s_])_(?![\p{L}\p{N}_])/u,
    build: (match) => ({
      kind: "emphasis",
      children: parseInline(match[1] ?? ""),
    }),
  },
];

function firstMatchOf(text: string) {
  let first: { match: RegExpExecArray; mark: Mark } | undefined;
  for (const mark of marks) {
    const match = mark.pattern.exec(text);
    if (
      match !== null &&
      (first === undefined || match.index < first.match.index)
    ) {
      first = { match, mark };
    }
  }
  return first;
}

export function parseInline(text: string): Inline[] {
  const found = firstMatchOf(text);
  if (found === undefined) return text === "" ? [] : [{ kind: "text", text }];
  const { match, mark } = found;
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  return [
    ...(before === "" ? [] : [{ kind: "text" as const, text: before }]),
    mark.build(match),
    ...parseInline(after),
  ];
}
