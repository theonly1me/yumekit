import type { ServerCommand } from "../agents/agentTypes.js";
import { findRunningEngine } from "../engineFile/findRunningEngine.js";
import type { Engine, Outcome } from "../engineTypes.js";
import { startEngine } from "../startEngine.js";
import type { EngineAddress } from "./homeTypes.js";

export interface EngineNotStarted {
  kind: "project-not-valid" | "engine-not-started";
  message: string;
}

type EngineOutcome = Outcome<EngineAddress, EngineNotStarted>;

export interface ProjectEngines {
  engineFor: (projectFolder: string) => Promise<EngineOutcome>;
  closeAll: () => Promise<void>;
}

function addressOf(url: string): EngineAddress {
  const parsed = new URL(url);
  return {
    url,
    origin: parsed.origin,
    token: parsed.searchParams.get("token") ?? "",
  };
}

export function createProjectEngines(options: {
  editorFolder: string | undefined;
  serverCommandOf: (projectFolder: string) => ServerCommand;
}): ProjectEngines {
  const started = new Map<string, Engine>();
  const pending = new Map<string, Promise<EngineOutcome>>();
  let isClosing = false;
  const start = async (projectFolder: string): Promise<EngineOutcome> => {
    const own = started.get(projectFolder);
    if (own !== undefined) return { ok: true, value: addressOf(own.url) };
    const running = await findRunningEngine(projectFolder);
    if (running !== undefined) return { ok: true, value: running };
    const engine = await startEngine({
      projectFolder,
      ...(options.editorFolder === undefined
        ? {}
        : { editorFolder: options.editorFolder }),
      serverCommand: options.serverCommandOf(projectFolder),
    });
    if (engine.ok) {
      if (isClosing) {
        await engine.value.close();
        return {
          ok: false,
          failure: {
            kind: "engine-not-started",
            message: "yumekit is stopping.",
          },
        };
      }
      started.set(projectFolder, engine.value);
      return { ok: true, value: addressOf(engine.value.url) };
    }
    const { failure } = engine;
    switch (failure.kind) {
      case "engine-already-running":
        return { ok: true, value: addressOf(failure.url) };
      case "project-invalid":
        return {
          ok: false,
          failure: { kind: "project-not-valid", message: failure.message },
        };
      case "port-not-free":
        return {
          ok: false,
          failure: {
            kind: "engine-not-started",
            message: `The port ${String(failure.port)} is not free.`,
          },
        };
    }
  };
  return {
    engineFor: (projectFolder) => {
      const waiting = pending.get(projectFolder);
      if (waiting !== undefined) return waiting;
      const next = start(projectFolder).finally(() => {
        pending.delete(projectFolder);
      });
      pending.set(projectFolder, next);
      return next;
    },
    closeAll: async () => {
      isClosing = true;
      await Promise.allSettled(pending.values());
      await Promise.all([...started.values()].map((engine) => engine.close()));
      started.clear();
    },
  };
}
