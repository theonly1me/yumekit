interface RequestTexts {
  text: string;
  details?: string | undefined;
}

const firstDetailLine = "Platforms: ";

export function shownRequestTextOf(request: RequestTexts): string {
  if (request.details !== undefined) return request.text;
  const lines = request.text.split("\n");
  const end = lines.findIndex((line) => line.startsWith(firstDetailLine));
  return (end < 1 ? lines : lines.slice(0, end)).join("\n");
}

export function fullRequestTextOf(request: RequestTexts): string {
  return request.details === undefined
    ? request.text
    : `${request.text}\n${request.details}`;
}
