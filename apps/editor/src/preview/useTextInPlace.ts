import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import type { JsonObject } from "../scenePanel/form/propPath.js";
import { plainIssue } from "../scenePanel/form/plainMessages.js";
import { callInOrder, type CallOutcome } from "../scenePanel/sceneCalls.js";
import {
  useKitScenes,
  type KitScenesState,
} from "../scenePanel/useKitScenes.js";
import {
  textChangeCallOf,
  type TextChange,
  type TextChangeCall,
} from "./textChange.js";

export interface TextInPlace {
  failure: string | undefined;
  onEditing: () => void;
  save: (change: TextChange) => Promise<{ kind: "saved" | "failed" }>;
}

interface SavedProps {
  props: JsonObject;
  revision: number;
}

function rejectionText(options: {
  outcome: Extract<CallOutcome, { kind: "rejected" }>;
  call: TextChangeCall;
  kitScenes: KitScenesState;
}): string {
  const { outcome, call, kitScenes } = options;
  const [issue] = outcome.issues;
  const schema =
    kitScenes.kind === "ready"
      ? kitScenes.kitScenes.find((scene) => scene.name === call.component)
          ?.props
      : undefined;
  const text =
    issue === undefined || schema === undefined
      ? outcome.message
      : plainIssue({ issue, schema, props: call.props }).message;
  return text.endsWith(".") ? text : `${text}.`;
}

export function useTextInPlace(options: {
  client: EngineClient;
  snapshot: Snapshot;
  onEditing: () => void;
}): TextInPlace {
  const { client, snapshot, onEditing } = options;
  const kitScenes = useKitScenes(client);
  const [failure, setFailure] = useState<string>();
  const latest = useRef({ snapshot, kitScenes });
  const savedScenes = useRef(new Map<string, SavedProps>());
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    latest.current = { snapshot, kitScenes };
  }, [snapshot, kitScenes]);

  const startEditing = useCallback(() => {
    setFailure(undefined);
    onEditing();
  }, [onEditing]);

  const saveNow = useCallback<TextInPlace["save"]>(
    async (change) => {
      const { snapshot: current } = latest.current;
      const saved = savedScenes.current.get(change.sceneId);
      const call = textChangeCallOf({
        snapshot: current,
        change,
        savedProps:
          saved !== undefined && saved.revision > current.revision
            ? saved.props
            : undefined,
      });
      if (call === undefined) {
        setFailure("This text cannot change here. Change it in the Scene tab.");
        return { kind: "failed" };
      }
      const outcome = await callInOrder({
        client,
        name: "put_scene",
        input: call.input,
      });
      if (outcome.kind === "done") {
        const revision = outcome.result.data["revision"];
        if (typeof revision === "number") {
          savedScenes.current.set(change.sceneId, {
            props: call.props,
            revision,
          });
        }
        return { kind: "saved" };
      }
      setFailure(
        `The text did not change. ${rejectionText({ outcome, call, kitScenes: latest.current.kitScenes })}`,
      );
      return { kind: "failed" };
    },
    [client],
  );

  const save = useCallback<TextInPlace["save"]>(
    (change) => {
      const next = saving.current.then(() => saveNow(change));
      saving.current = next.catch(() => undefined);
      return next;
    },
    [saveNow],
  );

  return useMemo(
    () => ({ failure, onEditing: startEditing, save }),
    [failure, startEditing, save],
  );
}
