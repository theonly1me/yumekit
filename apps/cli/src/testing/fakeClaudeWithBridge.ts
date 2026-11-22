import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";

const configurationSchema = z.object({
  mcpServers: z.object({
    yumekit: z.object({ command: z.string(), args: z.array(z.string()) }),
  }),
});

const programArguments = process.argv.slice(2);

function print(value: object): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function run(): Promise<void> {
  if (programArguments.slice(0, 2).join(" ") === "auth status") {
    print({ loggedIn: true });
    return;
  }
  const configuration = configurationSchema.parse(
    JSON.parse(
      programArguments[programArguments.indexOf("--mcp-config") + 1] ?? "",
    ),
  );
  const client = new Client({ name: "fake-claude", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({ ...configuration.mcpServers.yumekit }),
  );
  print({
    type: "system",
    subtype: "init",
    session_id: "made-up-bridge-session",
    mcp_servers: [{ name: "yumekit", status: "connected" }],
  });
  const toolUse = {
    type: "tool_use",
    id: "bridge-call-1",
    name: "mcp__yumekit__set_script",
    input: { script: "ready" },
  };
  print({ type: "assistant", message: { content: [toolUse] } });
  const result = await client.callTool({
    name: "set_script",
    arguments: { script: "ready" },
  });
  print({
    type: "user",
    message: {
      content: [
        {
          type: "tool_result",
          tool_use_id: "bridge-call-1",
          is_error: result.isError === true,
        },
      ],
    },
  });
  await client.close();
  print({
    type: "assistant",
    message: { content: [{ type: "text", text: "The script says ready." }] },
  });
  print({ type: "result", is_error: false, terminal_reason: "completed" });
}

await run();
