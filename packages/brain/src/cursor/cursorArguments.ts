export function cursorArgumentsOf(options: {
  request: string;
  sessionId: string | undefined;
  agentFolder: string;
}): string[] {
  return [
    "-p",
    ...["--output-format", "stream-json"],
    "--stream-partial-output",
    "--approve-mcps",
    "--trust",
    ...["--workspace", options.agentFolder],
    ...(options.sessionId === undefined ? [] : ["--resume", options.sessionId]),
    "--",
    options.request,
  ];
}
