import { messageOf } from "./sceneFailure.js";

export interface LoggedSceneError {
  sceneId: string | undefined;
  message: string;
}

export interface SceneErrorLog {
  runAs: <Value>(options: { sceneId: string; run: () => Value }) => Value;
  takeErrors: () => LoggedSceneError[];
}

export function createSceneErrorLog(): SceneErrorLog {
  let activeSceneId: string | undefined;
  let errors: LoggedSceneError[] = [];
  const record = (message: string) => {
    errors.push({ sceneId: activeSceneId, message });
  };
  const systemConsoleError = console.error.bind(console);
  console.error = (...values: unknown[]) => {
    record(values.map(messageOf).join(" "));
    systemConsoleError(...values);
  };
  window.addEventListener("error", (event) => {
    record(event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    record(messageOf(event.reason));
  });
  return {
    runAs: ({ sceneId, run }) => {
      const previousSceneId = activeSceneId;
      activeSceneId = sceneId;
      try {
        return run();
      } finally {
        activeSceneId = previousSceneId;
      }
    },
    takeErrors: () => {
      const taken = errors;
      errors = [];
      return taken;
    },
  };
}
