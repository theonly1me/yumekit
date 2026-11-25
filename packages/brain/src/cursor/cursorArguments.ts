export function cursorArgumentsOf(options: {
  request: string;
  sessionId: string | undefined;
  agentFolder: string;
  model: string | undefined;
}): string[] {
  return [
    "-p",
    ...["--output-format", "stream-json"],
    "--stream-partial-output",
    "--approve-mcps",
    "--trust",
    ...["--workspace", options.agentFolder],
    ...(options.model === undefined ? [] : ["--model", options.model]),
    ...(options.sessionId === undefined ? [] : ["--resume", options.sessionId]),
    "--",
    options.request,
  ];
}
