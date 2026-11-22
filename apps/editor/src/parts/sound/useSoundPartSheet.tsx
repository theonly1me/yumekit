import { useState } from "react";
import type { Chat } from "../../chat/useChat.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { Sheet } from "../../sheets/Sheet.js";
import type { SoundPartName } from "../../sound/soundRowFacts.js";
import { MusicView } from "../music/MusicView.js";
import { VoiceView } from "../voice/VoiceView.js";

const titles: Record<SoundPartName, string> = {
  voice: "The voice",
  music: "The music",
};

const lockedText =
  "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it.";

export function useSoundPartSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  chat: Chat;
}) {
  const { client, snapshot, chat } = options;
  const [part, setPart] = useState<SoundPartName>();
  const locked = chat.isRunning;
  const viewProps = { client, snapshot, locked, ask: chat.send };
  const sheet =
    part === undefined ? undefined : (
      <Sheet
        titleId="sound-part-title"
        onClose={() => {
          setPart(undefined);
        }}
      >
        <div className="sheet-body wide sound-part-sheet">
          <header className="sound-part-head">
            <h2 id="sound-part-title">{titles[part]}</h2>
            {locked ? (
              <div className="part-note">
                <p className="fact">{lockedText}</p>
                <button
                  type="button"
                  onClick={() => {
                    chat.stop().catch(() => undefined);
                  }}
                >
                  Stop
                </button>
              </div>
            ) : undefined}
          </header>
          {part === "voice" ? (
            <VoiceView {...viewProps} />
          ) : (
            <MusicView {...viewProps} />
          )}
        </div>
      </Sheet>
    );
  return { isOpen: part !== undefined, sheet, open: setPart };
}
