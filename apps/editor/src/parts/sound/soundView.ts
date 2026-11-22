import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import type { AskTheAi } from "../fixedRequests.js";

export interface SoundViewProps {
  client: EngineClient;
  snapshot: Snapshot;
  locked: boolean;
  ask: AskTheAi;
}

export const soundFileTypes = "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac";
