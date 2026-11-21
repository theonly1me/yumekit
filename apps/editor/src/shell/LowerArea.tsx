import type { EngineClient } from "../engine/engineClient.js";
import type {
  Output,
  SceneClip,
  Snapshot,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import { ScenesRow } from "../scenes/ScenesRow.js";
import { useSceneStills } from "../scenes/useSceneStills.js";
import { Timeline, type PickedClip } from "../timeline/Timeline.js";

export type LowerView = "scenes" | "timeline";

const views: { id: LowerView; label: string }[] = [
  { id: "scenes", label: "Scenes" },
  { id: "timeline", label: "Timeline" },
];

export function LowerArea(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  timeline: TimelineData;
  mainClips: SceneClip[];
  lengthFrames: number;
  frame: number;
  selectedClipId: string | undefined;
  view: LowerView;
  onView: (view: LowerView) => void;
  onPick: (clip: PickedClip) => void;
  onPickScene: (clip: SceneClip) => void;
  onSeek: (frame: number) => void;
}) {
  const { client, snapshot, output, mainClips } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const stills = useSceneStills({
    client,
    output,
    clips: mainClips,
    revision: snapshot.revision,
  });
  return (
    <section className="lower" aria-label="Scenes and timeline">
      <div className="lower-head">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            className="tab"
            aria-pressed={view.id === props.view}
            onClick={() => {
              props.onView(view.id);
            }}
          >
            {view.label}
          </button>
        ))}
        <p className="lower-fact" data-testid="frame-fact">
          Frame {props.frame} of {props.lengthFrames}
        </p>
      </div>
      {props.view === "scenes" ? (
        <ScenesRow
          output={output}
          clips={mainClips}
          scenes={snapshot.scenes}
          stills={stills}
          selectedClipId={props.selectedClipId}
          framesPerSecond={framesPerSecond}
          onPick={props.onPickScene}
        />
      ) : (
        <Timeline
          timeline={props.timeline}
          scenes={snapshot.scenes}
          assets={snapshot.assets}
          lengthFrames={props.lengthFrames}
          frame={props.frame}
          framesPerSecond={framesPerSecond}
          selectedClipId={props.selectedClipId}
          onPick={props.onPick}
          onSeek={props.onSeek}
        />
      )}
    </section>
  );
}
