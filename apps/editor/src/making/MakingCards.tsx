import { useMemo, type CSSProperties } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Snapshot } from "../engine/snapshot.js";
import { mainSceneClipsOf, timelineOf } from "../timeline/timelineFacts.js";
import {
  clipPictureKey,
  scenePictureKey,
  useMakingPictures,
  type MakingPicture,
} from "./useMakingPictures.js";

const slotsInRow = 5;

interface MakingCard {
  key: string;
  title: string;
  picture: MakingPicture | undefined;
}

function CardPicture(props: { picture: MakingPicture | undefined }) {
  const { picture } = props;
  if (picture === undefined) {
    return <span className="thumb-words">Making the picture</span>;
  }
  if (picture.kind === "failed") {
    return <span className="thumb-words">No picture</span>;
  }
  return <img src={picture.source} alt="" />;
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
  const unplacedScenes = useMemo(() => {
    const placedSceneIds = new Set(clips.map((clip) => clip.sceneId));
    return snapshot.scenes.filter((scene) => !placedSceneIds.has(scene.id));
  }, [snapshot.scenes, clips]);
  const unplacedSceneIds = useMemo(
    () => unplacedScenes.map((scene) => scene.id),
    [unplacedScenes],
  );
  const pictures = useMakingPictures({
    client: props.client,
    output,
    clips,
    unplacedSceneIds,
    revision: snapshot.revision,
  });
  const placed: MakingCard[] = clips.map((clip) => ({
    key: clipPictureKey(clip.id),
    title:
      snapshot.scenes.find((scene) => scene.id === clip.sceneId)?.title ?? "",
    picture: pictures.get(clipPictureKey(clip.id)),
  }));
  const unplaced: MakingCard[] = unplacedScenes.map((scene) => ({
    key: scenePictureKey(scene.id),
    title: scene.title,
    picture: pictures.get(scenePictureKey(scene.id)),
  }));
  const cards = [...placed, ...unplaced];
  const emptyCount =
    Math.max(slotsInRow, Math.ceil(cards.length / slotsInRow) * slotsInRow) -
    cards.length;
  const shape: CSSProperties = {
    aspectRatio: `${String(output.widthPixels)} / ${String(output.heightPixels)}`,
  };
  return (
    <ul className="making-cards" aria-label="Scenes">
      {cards.map((card) => (
        <li className="making-card" key={card.key}>
          <span className="thumb" style={shape}>
            <CardPicture picture={card.picture} />
          </span>
          <span>{card.title}</span>
        </li>
      ))}
      {Array.from({ length: emptyCount }, (...[, index]) => (
        <li
          className="making-card"
          data-empty="true"
          key={`empty-${String(index)}`}
        >
          <span className="thumb" style={shape} />
        </li>
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
