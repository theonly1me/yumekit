import { createInterface } from "node:readline";

const keyVariable = "YUMEKIT_EDITOR_TEST_KEY";

const hasCheckKey = !process.argv.includes("--without-check-key");

const acceptsNoPicture = process.argv.includes("--accepts-no-picture");

const description = {
  label: hasCheckKey ? "Key test server" : "Plain key test server",
  runs: "hosted",
  keys: [
    {
      variable: keyVariable,
      label: "Test key",
      get_key_url: "https://example.com/keys",
      steps: ["Open the key page and sign in.", "Make a key, then copy it."],
    },
  ],
  models: [
    {
      id: "test-video",
      label: "Test video model",
      capability: "video",
      is_default: true,
      settings: [
        {
          name: "duration_seconds",
          label: "Length in seconds",
          kind: "whole-number",
          minimum: 2,
          maximum: 10,
          default: 4,
        },
        {
          name: "resolution",
          label: "Resolution",
          kind: "choice",
          choices: ["480p", "720p"],
          default: "480p",
        },
      ],
      prices: [
        { usd: 0.1, unit: "second", when: { resolution: "480p" } },
        { usd: 0.25, unit: "second", when: { resolution: "720p" } },
      ],
      read_on: "2026-11-21",
      tested: false,
      ...(acceptsNoPicture ? { accepts: ["reference_images"] } : {}),
    },
  ],
};

const emptyInput = { type: "object", properties: {} };

const tools = ["describe_media_server", "check_key", "generate_video"]
  .filter((name) => hasCheckKey || name !== "check_key")
  .map((name) => ({ name, inputSchema: emptyInput }));

function toolResult(name: unknown): object {
  if (name === "describe_media_server") {
    return { content: [], structuredContent: description };
  }
  if (name === "check_key") {
    const isSet = (process.env[keyVariable] ?? "") !== "";
    return {
      content: [],
      structuredContent: {
        valid: isSet,
        message: isSet ? "The server got the key." : "The server got no key.",
      },
    };
  }
  return {
    isError: true,
    content: [{ type: "text", text: "The key test server makes no video." }],
  };
}

function resultOf(message: object): object {
  const method = "method" in message ? message.method : undefined;
  const params = "params" in message ? message.params : undefined;
  if (method === "initialize") {
    const requested =
      typeof params === "object" &&
      params !== null &&
      "protocolVersion" in params
        ? params.protocolVersion
        : undefined;
    return {
      protocolVersion: requested,
      capabilities: { tools: {} },
      serverInfo: { name: "yumekit-editor-key-test", version: "0.0.0" },
    };
  }
  if (method === "tools/list") return { tools };
  if (method === "tools/call") {
    const name =
      typeof params === "object" && params !== null && "name" in params
        ? params.name
        : undefined;
    return toolResult(name);
  }
  return {};
}

const lines = createInterface({ input: process.stdin });

lines.on("line", (line) => {
  const message: unknown = JSON.parse(line);
  if (typeof message !== "object" || message === null) return;
  if (!("id" in message)) return;
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: resultOf(message) })}\n`,
  );
});
