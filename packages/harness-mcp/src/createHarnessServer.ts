import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPictureRenderer } from "@yumekit/render";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { harnessToolsOf, type HarnessOptions } from "./harness/harnessTools.js";
import type { HarnessTool, ProgressListener } from "./harness/toolTable.js";
import { serverInstructions } from "./instructions.js";

type RequestExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

function noop(): void {
  return undefined;
}

function progressOptionOf(extra: RequestExtra): {
  onProgress?: ProgressListener;
} {
  const progressToken = extra._meta?.progressToken;
  if (progressToken === undefined) return {};
  return {
    onProgress: ({ done, total, message }) => {
      extra
        .sendNotification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: done,
            ...(total === undefined ? {} : { total }),
            ...(message === undefined ? {} : { message }),
          },
        })
        .catch(noop);
    },
  };
}

function registerMcpTool(options: {
  server: McpServer;
  tool: HarnessTool;
}): void {
  const { server, tool } = options;
  const config = {
    description: tool.description,
    ...(tool.annotations === undefined
      ? {}
      : { annotations: tool.annotations }),
  };
  if (Object.keys(tool.inputShape).length === 0) {
    server.registerTool(tool.name, config, (extra) =>
      tool.run({ input: {}, ...progressOptionOf(extra) }),
    );
    return;
  }
  server.registerTool(
    tool.name,
    { ...config, inputSchema: tool.inputShape },
    (...parameters) => {
      const [input, extra] = parameters;
      return tool.run({ input, ...progressOptionOf(extra) });
    },
  );
}

export function createHarnessServer(options: HarnessOptions): McpServer {
  const server = new McpServer(
    { name: "yumekit", version: "0.0.0" },
    { instructions: serverInstructions },
  );
  const pictures = createPictureRenderer({ folder: options.store.folder });
  const tools = harnessToolsOf({
    ...options,
    pictures,
    callerOf: () => "ai",
  });
  for (const tool of tools) {
    registerMcpTool({ server, tool });
  }
  const closeServer = server.close.bind(server);
  server.close = async () => {
    await closeServer();
    await pictures.close();
  };
  return server;
}
