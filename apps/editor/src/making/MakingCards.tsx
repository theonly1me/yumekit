import { useMemo } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Snapshot } from "../engine/snapshot.js";
import { stillKey, useSceneStills } from "../scenes/useSceneStills.js";
import { mainSceneClipsOf, timelineOf } from "../timeline/timelineFacts.js";

const slotsInRow = 5;

interface MakingCard {
  key: string;
  title: string;
  still: string | undefined;
}

function Stills(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
}) {
  const { snapshot, output } = props;
  const clips = useMemo(
    () =>
      mainSceneClipsOf({
        timeline: timelineOf({ snapshot, outputId: output.id }),
        scenes: snapshot.scenes,
      }),
    [snapshot, output.id],
  );
  const stills = useSceneStills({
    client: props.client,
    output,
    clips,
    revision: snapshot.revision,
  });
  const placed: MakingCard[] = clips.map((clip) => ({
    key: clip.id,
    title:
      snapshot.scenes.find((scene) => scene.id === clip.sceneId)?.title ?? "",
    still: stills.get(stillKey({ outputId: output.id, clipId: clip.id })),
  }));
  const placedSceneIds = new Set(clips.map((clip) => clip.sceneId));
  const unplaced: MakingCard[] = snapshot.scenes
    .filter((scene) => !placedSceneIds.has(scene.id))
    .map((scene) => ({ key: scene.id, title: scene.title, still: undefined }));
  const cards = [...placed, ...unplaced];
  const emptyCount =
    Math.max(slotsInRow, Math.ceil(cards.length / slotsInRow) * slotsInRow) -
    cards.length;
  return (
    <ul className="making-cards" aria-label="Scenes">
      {cards.map((card) => (
        <li className="making-card" key={card.key}>
          <span className="thumb">
            {card.still === undefined ? undefined : (
              <img src={card.still} alt="" />
            )}
          </span>
          <span>{card.title}</span>
        </li>
      ))}
      {Array.from({ length: emptyCount }, (...[, index]) => (
        <li
          className="making-card"
          data-empty="true"
          key={`empty-${String(index)}`}
        />
      ))}
    </ul>
  );
}

export function MakingCards(props: {
  client: EngineClient;
  snapshot: Snapshot;
}) {
  const [output] = props.snapshot.project.outputs;
  if (output === undefined) return undefined;
  return (
    <Stills client={props.client} snapshot={props.snapshot} output={output} />
  );
}
