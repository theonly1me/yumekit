import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { captionOf, type ShownKind } from "../itemFacts.js";
import { PinnedPicture } from "../media/PinnedPicture.js";
import { Player, type PlayerMedia } from "../media/Player.js";
import { useItemUrl } from "../media/useItemUrl.js";
import {
  addMoment,
  addPin,
  type DraftChange,
  type ItemDraft,
} from "../review/itemDrafts.js";
import type { ShownItem } from "../shownItems.js";
import { StoryText } from "./StoryText.js";

export function RowMedia(props: {
  client: EngineClient;
  snapshot: Snapshot;
  shown: ShownItem;
  kind: ShownKind;
  takeId: string;
  draft: ItemDraft;
  canMark: boolean;
  onMedia: (element: PlayerMedia | null) => void;
  onChange: (next: DraftChange) => void;
  onMarkAdded: (markId: string) => void;
  onFullSize: () => void;
}) {
  const { shown, kind, canMark } = props;
  const url = useItemUrl({
    client: props.client,
    item: shown.item,
    takeId: props.takeId,
  });
  const caption = captionOf(shown);
  if (kind === "story") return <StoryText snapshot={props.snapshot} />;
  if (kind === "picture") {
    return (
      <div className="row-picture">
        <PinnedPicture
          url={url}
          caption={caption}
          pins={props.draft.pins}
          onPin={
            canMark
              ? (at) => {
                  const id = crypto.randomUUID();
                  props.onChange(addPin({ id, ...at }));
                  props.onMarkAdded(id);
                }
              : undefined
          }
        />
        <p className="media-hint">
          <button type="button" className="link" onClick={props.onFullSize}>
            Full size
          </button>
          {canMark ? (
            <span>Click the picture to pin a mistake.</span>
          ) : undefined}
        </p>
      </div>
    );
  }
  return (
    <Player
      url={url}
      isSound={kind === "music"}
      title={caption}
      framesPerSecond={props.snapshot.project.framesPerSecond}
      moments={props.draft.moments.map((moment) => moment.seconds)}
      onMedia={props.onMedia}
      onMark={
        canMark
          ? (seconds) => {
              const id = crypto.randomUUID();
              props.onChange(addMoment({ id, seconds }));
              props.onMarkAdded(id);
            }
          : undefined
      }
    />
  );
}
