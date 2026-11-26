const uploadTool = "import_asset";

export function actSummaryOf(options: {
  tools: string[];
  lastSummary: string;
}): string {
  const { tools } = options;
  const isUploadOfFiles =
    tools.length > 1 && tools.every((tool) => tool === uploadTool);
  return isUploadOfFiles
    ? `You added ${String(tools.length)} files to the project.`
    : options.lastSummary;
}
