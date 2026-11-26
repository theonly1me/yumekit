const ruleShape = /^([A-Za-z]+)\((.*)\)$/s;

export function ruleTextOf(rule: string): string {
  const server = /^mcp__(.+?)__(.+)$/.exec(rule);
  if (server !== null) {
    const [, serverName = "", tool = ""] = server;
    return `Use the tool ${tool} of ${serverName}`;
  }
  if (rule === "WebSearch") return "Search the web";
  const shaped = ruleShape.exec(rule);
  if (shaped === null) return `Use ${rule}`;
  const [, tool = "", content = ""] = shaped;
  if (tool === "WebFetch") {
    return `Open web pages on ${content.replace(/^domain:/, "")}`;
  }
  if (tool === "Bash") return `Run the command ${content}`;
  if (tool === "Edit")
    return `Change the file ${content.replace(/^\/\//, "/")}`;
  return `Use ${tool} for ${content}`;
}
