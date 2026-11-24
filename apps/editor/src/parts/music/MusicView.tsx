import { useState } from "react";
import { MadeWith, type ModelTarget } from "../../settings/services/index.js";
import { FileDrop } from "../files/FileDrop.js";
import { YourFile } from "../files/YourFile.js";
import { sendFixedRequest } from "../fixedRequests.js";
import { PlayButton } from "../sound/PlayButton.js";
import { soundFileTypes, type SoundViewProps } from "../sound/soundView.js";
import { StatusLine } from "../sound/StatusLine.js";
import { useSoundActions } from "../sound/useSoundActions.js";
import { CheckedMusicGroup } from "./CheckedMusicGroup.js";
import { LocalMusicGroup } from "./LocalMusicGroup.js";
import { musicFactsOf } from "./musicFacts.js";
import { MusicVolume } from "./MusicVolume.js";
import { SoundsGroup } from "./SoundsGroup.js";
import "../sound/soundParts.css";

export function MusicView(props: SoundViewProps) {
  const { client, snapshot, locked } = props;
  const facts = musicFactsOf(snapshot);
  const actions = useSoundActions({ client, snapshot, part: "music" });
  const [words, setWords] = useState("");
  const [onceModel, setOnceModel] = useState<ModelTarget>();
  const isOff = facts.track?.off === true;
  const changesAreOff = locked || actions.isWorking;
  const { asset, piece, track } = facts;

  return (
    <div className="sound-part">
      <section className="part-group">
        <h4>In your video now</h4>
        {asset?.source.kind === "import" ? (
          <YourFile />
        ) : (
          <MadeWith client={client} kind="music" />
        )}
        {piece === undefined ? (
          <p className="fact lead">The video has no music yet.</p>
        ) : (
          <div className="sound-track" data-off={isOff}>
            <PlayButton
              client={client}
              piece={piece}
              label="the music"
              withWave
            />
            <span className="track-name">{facts.name}</span>
            <span className="fact">{isOff ? "Off" : facts.length}</span>
          </div>
        )}
        {track === undefined ? undefined : (
          <MusicVolume
            gainDecibels={facts.gainDecibels}
            disabled={changesAreOff}
            onChange={actions.setGain}
          />
        )}
        <div className="part-actions">
          <button
            type="button"
            disabled={asset === undefined || actions.isWorking}
            onClick={() => {
              if (asset !== undefined) actions.download([asset.id]);
            }}
          >
            Download the music
          </button>
          {track === undefined ? undefined : (
            <button
              type="button"
              disabled={changesAreOff}
              onClick={() => {
                actions.switchTrack({ trackId: track.id, off: !isOff });
              }}
            >
              {isOff ? "Put the music back" : "Remove the music"}
            </button>
          )}
        </div>
      </section>
      <CheckedMusicGroup client={client} snapshot={snapshot} locked={locked} />
      <LocalMusicGroup client={client} snapshot={snapshot} locked={locked} />
      <section className="part-group">
        <h4>Try another</h4>
        <form
          className="describe"
          onSubmit={(event) => {
            event.preventDefault();
            sendFixedRequest({
              ask: props.ask,
              request: {
                kind: "make-this-music",
                words: words.trim(),
                ...(onceModel === undefined ? {} : { model: onceModel }),
              },
            })
              .then((isSent) => {
                if (isSent) setWords("");
              })
              .catch(() => undefined);
          }}
        >
          <label>
            Or describe the music
            <input
              type="text"
              value={words}
              placeholder="For example: slow strings that build to a bright end"
              required
              disabled={locked}
              onChange={(event) => {
                setWords(event.currentTarget.value);
              }}
            />
          </label>
          <button type="submit" disabled={locked || words.trim() === ""}>
            Make this music
          </button>
        </form>
        <MadeWith
          client={client}
          kind="music"
          once={{ chosen: onceModel, onChoose: setOnceModel }}
        />
      </section>
      <SoundsGroup
        client={client}
        snapshot={snapshot}
        locked={locked}
        ask={props.ask}
      />
      <section className="part-group">
        <h4>Use my own music</h4>
        <FileDrop
          label="Drop a sound file here, or click to pick one"
          hint="MP3, WAV, or M4A. yumekit cuts or repeats it to the length of the video."
          accept={soundFileTypes}
          disabled={changesAreOff}
          onFile={actions.takeFile}
        />
      </section>
      <StatusLine status={actions.status} />
    </div>
  );
}
