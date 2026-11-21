import { connectAgent, listAgents } from "../agents/connectAgent.js";
import { isAgentId, type ConnectFailure } from "../agents/agentTypes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { sendJson, type Failure } from "./responses.js";

const noServerCommand: Failure = {
  status: 409,
  kind: "no-server-command",
  message:
    "This engine cannot connect an agent. Start the editor with yumekit open.",
};

function connectFailureOf(failure: ConnectFailure): Failure {
  return {
    status: failure.kind === "configuration-not-valid" ? 409 : 500,
    kind: failure.kind,
    message: failure.message,
  };
}

async function readAgents(exchange: Exchange) {
  const { context } = exchange;
  if (context.serverCommand === undefined) return noServerCommand;
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      agents: await listAgents({ projectFolder: context.projectFolder }),
      connected: context.events.agentConnectionCount(),
      serverCommand: context.serverCommand,
    },
  });
  return undefined;
}

async function connect(exchange: Exchange) {
  const { context } = exchange;
  const [agentId = ""] = exchange.parameters;
  if (!isAgentId(agentId)) {
    return {
      status: 404,
      kind: "agent-not-found",
      message: `yumekit cannot connect the agent "${agentId}".`,
    };
  }
  if (context.serverCommand === undefined) return noServerCommand;
  const connected = await connectAgent({
    agentId,
    projectFolder: context.projectFolder,
    serverCommand: context.serverCommand,
  });
  if (!connected.ok) return connectFailureOf(connected.failure);
  sendJson({ response: exchange.response, status: 200, body: connected.value });
  return undefined;
}

export const agentRoutes: Route[] = [
  { method: "GET", pattern: ["api", "agents"], handle: readAgents },
  {
    method: "POST",
    pattern: ["api", "agents", anySegment, "connect"],
    handle: connect,
  },
];
