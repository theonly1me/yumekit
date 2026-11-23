import type { EngineClient } from "../../engine/engineClient.js";
import { PlayButton } from "../../parts/sound/PlayButton.js";
import type { SceneVoice } from "./talkingFacts.js";
import { talkingSecondsOf } from "./useTalkingChoice.js";
import { useVoiceWords } from "./useVoiceWords.js";

export const recordVoiceText = "Record a voice line for this scene";

export function VoiceGroup(props: {
  client: EngineClient;
  voice: SceneVoice | undefined;
  onRecordVoice: () => void;
}) {
  const { client, voice } = props;
  const words = useVoiceWords({ client, voice });
  if (voice === undefined) {
    return (
      <div className="talking-voice">
        <p className="field-label">Voice</p>
        <p className="fact">This scene has no voice yet.</p>
        <button type="button" onClick={props.onRecordVoice}>
          {recordVoiceText}
        </button>
      </div>
    );
  }
  return (
    <div className="talking-voice">
      <p className="field-label">Voice</p>
      <div className="talking-voice-line">
        <PlayButton
          client={client}
          piece={{
            assetId: voice.assetId,
            startSeconds: voice.startSeconds,
            lengthSeconds: voice.lengthSeconds,
          }}
          label="the voice of this scene"
          withWave
        />
      </div>
      <p className="fact">
        {words === "" ? "The voice of this scene." : `“${words}”`}{" "}
        {talkingSecondsOf(voice.leadSeconds + voice.lengthSeconds)} seconds. The
        clip plays it once, in place of the voice line.
      </p>
    </div>
  );
}
