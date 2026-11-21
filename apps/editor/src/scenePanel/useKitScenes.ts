import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { kitScenesSchema, type KitScenes } from "./form/propSchema.js";
import { clientFailureText } from "./sceneCalls.js";

export type KitScenesState =
  | { kind: "loading" }
  | { kind: "ready"; kitScenes: KitScenes }
  | { kind: "failed"; message: string };

const loads = new WeakMap<EngineClient, Promise<KitScenesState>>();

async function loadKitScenes(client: EngineClient): Promise<KitScenesState> {
  const reply = await client.callTool({ name: "list_kit_scenes", input: {} });
  if (!reply.ok) {
    return { kind: "failed", message: clientFailureText(reply.failure) };
  }
  const parsed = kitScenesSchema.safeParse(reply.value.data);
  return parsed.success
    ? { kind: "ready", kitScenes: parsed.data.kit_scenes }
    : {
        kind: "failed",
        message: `The editor cannot read the kit scenes: ${parsed.error.message}`,
      };
}

function kitScenesOf(client: EngineClient): Promise<KitScenesState> {
  const known = loads.get(client);
  if (known !== undefined) return known;
  const load = loadKitScenes(client);
  loads.set(client, load);
  load
    .then((state) => {
      if (state.kind === "failed") loads.delete(client);
    })
    .catch(() => {
      loads.delete(client);
    });
  return load;
}

export function useKitScenes(client: EngineClient): KitScenesState {
  const [state, setState] = useState<KitScenesState>({ kind: "loading" });

  useEffect(() => {
    let isCurrent = true;
    kitScenesOf(client)
      .then((loaded) => {
        if (isCurrent) setState(loaded);
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ kind: "failed", message: String(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [client]);

  return state;
}
