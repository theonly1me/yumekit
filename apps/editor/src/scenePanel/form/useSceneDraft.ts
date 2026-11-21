import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Scene } from "../../engine/snapshot.js";
import { callInOrder, type FailureIssue } from "../sceneCalls.js";
import {
  isJsonObject,
  withValueAt,
  type JsonObject,
  type JsonValue,
  type PropPath,
} from "./propPath.js";

export type SendTiming = "after-pause" | "now" | "on-next-change";

export type DraftFailure =
  | { kind: "none" }
  | {
      kind: "rejected";
      message: string;
      hint: string | undefined;
      issues: FailureIssue[];
    };

const pauseMilliseconds = 450;

export type IssueWording = (options: {
  issues: FailureIssue[];
  props: JsonObject;
}) => FailureIssue[];

export function useSceneDraft(options: {
  client: EngineClient;
  scene: Scene;
  component: string;
  wordIssues: IssueWording;
  revision: number;
}) {
  const { client, scene, component, wordIssues, revision } = options;
  const storedKey = JSON.stringify(scene.source.props);
  const [draft, setDraft] = useState<JsonObject>(scene.source.props);
  const [failure, setFailure] = useState<DraftFailure>({ kind: "none" });
  const latest = useRef({ draft, scene, component, wordIssues, revision });
  const ownRevision = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const isUnsent = useRef(false);
  const callsInFlight = useRef(0);
  const sendNumber = useRef(0);

  useEffect(() => {
    latest.current = {
      ...latest.current,
      scene,
      component,
      wordIssues,
      revision,
    };
  }, [scene, component, wordIssues, revision]);

  const send = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    if (!isUnsent.current) return;
    isUnsent.current = false;
    sendNumber.current += 1;
    const thisSend = sendNumber.current;
    callsInFlight.current += 1;
    const current = latest.current;
    callInOrder({
      client,
      name: "put_scene",
      input: {
        scene_id: current.scene.id,
        title: current.scene.title,
        notes: current.scene.notes,
        kit_component: current.component,
        props: current.draft,
      },
    })
      .then((outcome) => {
        if (outcome.kind === "done") {
          const saved = outcome.result.data["revision"];
          if (typeof saved === "number") {
            ownRevision.current = Math.max(ownRevision.current, saved);
          }
        }
        if (thisSend !== sendNumber.current) return;
        setFailure(
          outcome.kind === "done"
            ? { kind: "none" }
            : {
                ...outcome,
                issues: current.wordIssues({
                  issues: outcome.issues,
                  props: current.draft,
                }),
              },
        );
      })
      .catch((error: unknown) => {
        setFailure({
          kind: "rejected",
          message: String(error),
          hint: undefined,
          issues: [],
        });
      })
      .finally(() => {
        callsInFlight.current -= 1;
      });
  }, [client]);

  const change = useCallback(
    (change: {
      path: PropPath;
      value: JsonValue | undefined;
      timing: SendTiming;
    }) => {
      const next = withValueAt({
        value: latest.current.draft,
        path: change.path,
        next: change.value,
      });
      const nextDraft = isJsonObject(next) ? next : {};
      latest.current = { ...latest.current, draft: nextDraft };
      setDraft(nextDraft);
      isUnsent.current = true;
      window.clearTimeout(timer.current);
      timer.current = undefined;
      if (change.timing === "now") send();
      if (change.timing === "after-pause") {
        timer.current = window.setTimeout(send, pauseMilliseconds);
      }
    },
    [send],
  );

  useEffect(() => {
    const isWaiting =
      timer.current !== undefined ||
      callsInFlight.current > 0 ||
      isUnsent.current;
    const isOwnChange = latest.current.revision <= ownRevision.current;
    if (isWaiting || isOwnChange) return;
    const stored = latest.current.scene.source.props;
    latest.current = { ...latest.current, draft: stored };
    setDraft(stored);
    setFailure({ kind: "none" });
  }, [storedKey]);

  useEffect(() => send, [send]);

  return { draft, failure, change, flush: send };
}
