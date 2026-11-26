import type { ChapterEdits } from "../chapters/chapterEdits.js";
import { ChapterRow } from "../chapters/ChapterRow.js";
import type { FilmChapters } from "../chapters/filmChapters.js";
import { fitTheVoiceRequest } from "../chat/requestTexts.js";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import { fixedRequestTextOf } from "../parts/fixedRequests.js";
import type { EditorChat } from "../shell/useEditorChat.js";
import { SceneActions, type PickedCard } from "./SceneActions.js";
import { isVideoScene, SceneCards } from "./SceneCards.js";
import type { CardContext } from "./cardFacts.js";
import type { SceneEdits } from "./sceneEdits.js";
import type { DirectChanges } from "./useDirectChanges.js";

export function ScenesRow(props: {
  snapshot: Snapshot;
  context: CardContext;
  film: FilmChapters;
  picked: PickedCard | undefined;
  changes: DirectChanges;
  edits: SceneEdits;
  chapterEdits: ChapterEdits;
  editorChat: EditorChat;
  pickedChapterId: string | undefined;
  onPickChapter: (chapterId: string | undefined) => void;
  onDropSceneInChapter: (drop: { clipId: string; chapterId: string }) => void;
  onDropItem: (drop: { assetId: string; clip: SceneClip }) => void;
  onPickCard: (clip: SceneClip) => void;
  onEditText: () => void;
  onMakeClip: (clip: SceneClip) => void;
  onOpenTakes: (chapterId: string) => void;
}) {
  const { snapshot, film, picked, changes, edits, editorChat } = props;
  const sceneFailure = changes.failureOf("scenes");
  const pickedCard = film.cards.find(
    (card) => card.clip.id === picked?.clip.id,
  );
  return (
    <section className="scenes-row" aria-label="Scenes and actions">
      {film.isSplit ? (
        <ChapterRow
          film={film}
          framesPerSecond={props.context.framesPerSecond}
          pickedChapterId={props.pickedChapterId}
          pickedCard={
            pickedCard === undefined || picked === undefined
              ? undefined
              : { card: pickedCard, title: picked.title }
          }
          edits={props.chapterEdits}
          onPick={props.onPickChapter}
          onDropScene={props.onDropSceneInChapter}
          onOpenTakes={props.onOpenTakes}
        />
      ) : undefined}
      {film.cards.length === 0 ? (
        <p className="fact">
          This video has no scenes yet. Ask the AI in the chat to make it.
        </p>
      ) : (
        <SceneCards
          context={props.context}
          film={film}
          chapterEdits={props.chapterEdits}
          onPick={props.onPickCard}
          onAddScene={editorChat.sendText}
          onTransition={edits.transition}
          onDropItem={props.onDropItem}
        />
      )}
      {changes.voiceMayNotMatch ? (
        <div className="voice-note" role="status">
          <p>The voice may not match the scenes now.</p>
          <button
            type="button"
            disabled={editorChat.chat.isRunning}
            onClick={() => {
              editorChat.sendText(fitTheVoiceRequest);
            }}
          >
            Ask the AI to fit the voice
          </button>
        </div>
      ) : undefined}
      {picked === undefined ? undefined : (
        <SceneActions
          picked={picked}
          isVideo={isVideoScene(
            snapshot.scenes.find((scene) => scene.id === picked.clip.sceneId),
          )}
          isChatRunning={editorChat.chat.isRunning}
          framesPerSecond={props.context.framesPerSecond}
          onEditText={props.onEditText}
          onLength={(durationFrames) => {
            edits.resize({ clip: picked.clip, durationFrames });
          }}
          onMakeClip={() => {
            props.onMakeClip(picked.clip);
          }}
          onBackToGraphics={() => {
            editorChat.sendAboutClip({
              text: fixedRequestTextOf({
                kind: "back-to-graphics",
                aboutClipId: picked.clip.id,
              }),
              clipId: picked.clip.id,
            });
          }}
          onDuplicate={() => {
            edits.duplicate(picked.clip);
          }}
          onDelete={() => {
            edits.remove(picked.clip);
          }}
        />
      )}
      {sceneFailure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {sceneFailure}
        </p>
      )}
    </section>
  );
}
