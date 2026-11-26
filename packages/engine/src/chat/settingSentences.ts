export function settingSentenceOf(options: {
  tool: string;
  input: Readonly<Record<string, unknown>>;
}): string | undefined {
  const { tool, input } = options;
  const isApprovalOn = input["approve_pictures_first"];
  if (
    tool === "set_approve_pictures_first" &&
    typeof isApprovalOn === "boolean"
  ) {
    return `You turned ${isApprovalOn ? "on" : "off"} "Approve pictures before clips".`;
  }
  const name = input["name"];
  if (tool === "set_project_name" && typeof name === "string") {
    return `You renamed the project to "${name.trim()}".`;
  }
  return undefined;
}
