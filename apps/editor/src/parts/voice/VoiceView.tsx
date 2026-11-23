import { useState } from "react";
import { MadeWith, type ModelTarget } from "../../settings/services/index.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import { FileButton } from "../files/FileDrop.js";
import { YourFile } from "../files/YourFile.js";
import { sendFixedRequest, type FixedRequest } from "../fixedRequests.js";
import { isVoiceOld, oldVoiceText } from "../../sound/oldVoice.js";
import { PlayButton } from "../sound/PlayButton.js";
import { soundFileTypes, type SoundViewProps } from "../sound/soundView.js";
import { StatusLine } from "../sound/StatusLine.js";
import { useSoundActions } from "../sound/useSoundActions.js";
import { voiceChoicesOf, voiceFactsOf } from "./voiceFacts.js";
import "../sound/soundParts.css";

export function VoiceView(props: SoundViewProps) {
  const { client, snapshot, locked } = props;
  const facts = voiceFactsOf(snapshot);
  const media = useMediaServers(client);
  const choices = voiceChoicesOf({
    snapshot,
    facts,
    servers: media.state.kind === "ready" ? media.state.servers : undefined,
  });
  const actions = useSoundActions({ client, snapshot, part: "voice" });
  const [onceModel, setOnceModel] = useState<ModelTarget>();
  const isOff = facts.track?.off === true;
  const changesAreOff = locked || actions.isWorking;
  const ask = (request: FixedRequest) => {
    sendFixedRequest({ ask: props.ask, request }).catch(() => undefined);
  };

  return (
    <div className="sound-part">
      {choices.names.length === 0 ? undefined : (
        <section className="part-group">
          <h4>Who speaks</h4>
          <div className="segments" role="group" aria-label="Voice">
            {choices.names.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={name === choices.current}
                disabled={changesAreOff}
                onClick={() => {
                  if (name !== choices.current || onceModel !== undefined) {
                    ask({
                      kind: "another-voice",
                      voiceName: name,
                      ...(onceModel === undefined ? {} : { model: onceModel }),
                    });
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <MadeWith
            client={client}
            kind="speech"
            once={{ chosen: onceModel, onChoose: setOnceModel }}
          />
        </section>
      )}
      <section className="part-group">
        <h4>What the voice says</h4>
        {facts.isOwnRecording ? (
          <YourFile />
        ) : (
          <MadeWith client={client} kind="speech" />
        )}
        {facts.lines.length > 0 && isVoiceOld(snapshot) ? (
          <div className="voice-note" role="status">
            <p>{oldVoiceText}</p>
            <button
              type="button"
              disabled={changesAreOff}
              onClick={() => {
                ask({ kind: "record-the-changed-lines" });
              }}
            >
              Record the voice again
            </button>
          </div>
        ) : undefined}
        {facts.lines.length === 0 ? (
          <p className="fact lead">
            The video has no voice yet. Ask the AI in the chat to record one, or
            use your own recording.
          </p>
        ) : (
          <ul className="voice-lines">
            {facts.lines.map((line) => (
              <li key={line.clipId} className="voice-line">
                <PlayButton
                  client={client}
                  piece={line.piece}
                  label={line.sceneLabel}
                />
                <span className="voice-scene">{line.sceneLabel}</span>
                <span className="voice-words">{line.words}</span>
              </li>
            ))}
          </ul>
        )}
        {facts.isOwnRecording && facts.hasCaptions ? (
          <div className="part-note">
            <p className="fact">
              Your recording has no word times, so the captions do not follow it
              yet.
            </p>
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                ask({ kind: "match-the-captions" });
              }}
            >
              Make the captions match my recording
            </button>
          </div>
        ) : undefined}
        <div className="part-actions">
          <FileButton
            label="Use my own recording"
            accept={soundFileTypes}
            disabled={changesAreOff}
            onFile={actions.takeFile}
          />
          <button
            type="button"
            disabled={facts.assetIds.length === 0 || actions.isWorking}
            onClick={() => {
              actions.download(facts.assetIds);
            }}
          >
            Download the voice
          </button>
          {facts.track === undefined ? undefined : (
            <button
              type="button"
              disabled={changesAreOff}
              onClick={() => {
                if (facts.track !== undefined) {
                  actions.switchTrack({ trackId: facts.track.id, off: !isOff });
                }
              }}
            >
              {isOff ? "Put the voice back" : "Remove the voice"}
            </button>
          )}
        </div>
      </section>
      <StatusLine status={actions.status} />
    </div>
  );
}
