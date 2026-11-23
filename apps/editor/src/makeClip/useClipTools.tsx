import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import { sendFixedRequest, type AskTheAi } from "../parts/fixedRequests.js";
import { MakeClipEntry } from "./MakeClipEntry.js";
import { MakeClipSheet } from "./MakeClipSheet.js";
import { speakersOf } from "./talking/talkingFacts.js";
import { TalkingClipSheet } from "./talking/TalkingClipSheet.js";

export function useClipTools(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output | undefined;
  onOpen: () => void;
  onPlaced: (clip: { id: string; startFrame: number }) => void;
  ask: AskTheAi;
}) {
  const { client, snapshot, output } = options;
  const [clipFor, setClipFor] = useState<SceneClip>();
  const [talkFor, setTalkFor] = useState<SceneClip>();

  const open = (clip: SceneClip) => {
    options.onOpen();
    setClipFor(clip);
  };

  const placed = (made: { sceneClipId: string; startFrame: number }) => {
    options.onPlaced({ id: made.sceneClipId, startFrame: made.startFrame });
  };

  const entryFor = (target: { scene: Scene; clip: SceneClip }) => (
    <MakeClipEntry
      scene={target.scene}
      onOpen={() => {
        open(target.clip);
      }}
      onTalk={
        speakersOf({ snapshot, scene: target.scene }).length === 0
          ? undefined
          : () => {
              options.onOpen();
              setTalkFor(target.clip);
            }
      }
    />
  );

  const talkSheet =
    talkFor === undefined || output === undefined ? undefined : (
      <TalkingClipSheet
        client={client}
        snapshot={snapshot}
        output={output}
        clip={talkFor}
        onClose={() => {
          setTalkFor(undefined);
        }}
        onPlaced={(made) => {
          setTalkFor(undefined);
          placed(made);
        }}
        onRecordVoice={(clipId) => {
          setTalkFor(undefined);
          sendFixedRequest({
            ask: options.ask,
            request: { kind: "record-a-voice-line", aboutClipId: clipId },
          }).catch(() => undefined);
        }}
      />
    );

  const sheet =
    clipFor === undefined || output === undefined ? undefined : (
      <MakeClipSheet
        client={client}
        snapshot={snapshot}
        output={output}
        clip={clipFor}
        onClose={() => {
          setClipFor(undefined);
        }}
        onAskTheAi={(model) => {
          setClipFor(undefined);
          sendFixedRequest({
            ask: options.ask,
            request: {
              kind: "let-the-ai-make-the-clip",
              aboutClipId: clipFor.id,
              ...(model === undefined ? {} : { model }),
            },
          }).catch(() => undefined);
        }}
        onPlaced={(made) => {
          setClipFor(undefined);
          placed(made);
        }}
      />
    );

  return {
    open,
    entryFor,
    sheet: sheet ?? talkSheet,
    isOpen: sheet !== undefined || talkSheet !== undefined,
  };
}
