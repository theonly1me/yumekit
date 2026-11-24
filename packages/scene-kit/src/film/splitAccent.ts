export interface AccentParts {
  before: string;
  accent: string;
  after: string;
}

export function splitAccent(options: {
  text: string;
  accent: string | undefined;
}): AccentParts {
  const { text, accent } = options;
  const wanted = (accent ?? "").trim();
  const start =
    wanted === "" ? -1 : text.toLowerCase().indexOf(wanted.toLowerCase());
  if (start === -1) return { before: text, accent: "", after: "" };
  const end = start + wanted.length;
  return {
    before: text.slice(0, start),
    accent: text.slice(start, end),
    after: text.slice(end),
  };
}
