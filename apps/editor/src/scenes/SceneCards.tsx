import { Fragment, useEffect, useRef, useState } from "react";
import type { ChapterEdits } from "../chapters/chapterEdits.js";
import { ChapterGroup, ChapterLine } from "../chapters/ChapterGroups.js";
import type { ChapterCard, FilmChapters } from "../chapters/filmChapters.js";
import { newSceneRequest } from "../chat/requestTexts.js";
import type { SceneClip } from "../engine/snapshot.js";
import {
  choiceOf,
  type TransitionChoice,
} from "../transitions/transitionChoices.js";
import { TransitionForm } from "../transitions/TransitionForm.js";
import { TransitionMark } from "../transitions/TransitionMark.js";
import { AddSceneForm } from "./AddSceneForm.js";
import { cardDropOf, cardFactsOf, type CardContext } from "./cardFacts.js";
import type { DragKind } from "./dragData.js";
import { SceneCard } from "./SceneCard.js";
import { useScrollEdges } from "./useScrollEdges.js";
import "./scenes.css";

export { isVideoScene } from "./cardFacts.js";

export function SceneCards(props: {
  context: CardContext;
  film: FilmChapters;
  chapterEdits: ChapterEdits;
  onPick: (clip: SceneClip) => void;
  onAddScene: (request: string) => void;
  onTransition: (change: { clip: SceneClip; kind: TransitionChoice }) => void;
  onDropItem: (drop: { assetId: string; clip: SceneClip }) => void;
}) {
  const { film, chapterEdits, context } = props;
  const { pickedClipId } = context;
  const list = useRef<HTMLOListElement>(null);
  const keyMovedClipId = useRef<string | undefined>(undefined);
  const [addingAfter, setAddingAfter] = useState<number>();
  const [choosingInto, setChoosingInto] = useState<number>();
  const [over, setOver] = useState<{ clipId: string; kind: DragKind }>();
  const clips = film.cards.map((card) => card.clip);
  const choosingClip =
    choosingInto === undefined ? undefined : clips[choosingInto];
  const order = film.cards
    .map((card) => `${card.clip.id}:${card.chapterId}`)
    .join(" ");
  const edges = useScrollEdges({ element: list, contentKey: order });

  useEffect(() => {
    if (pickedClipId === undefined) return;
    list.current
      ?.querySelector(`[data-card="${CSS.escape(pickedClipId)}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pickedClipId]);

  useEffect(() => {
    const clipId = keyMovedClipId.current;
    if (clipId === undefined) return;
    keyMovedClipId.current = undefined;
    list.current
      ?.querySelector<HTMLButtonElement>(`[data-card="${CSS.escape(clipId)}"]`)
      ?.focus();
  }, [order]);

  const neighborOf = (index: number) => {
    const card = film.cards[index];
    return card === undefined
      ? undefined
      : { number: index + 1, title: cardFactsOf({ card, context }).title };
  };
  const markAfter = (index: number) => {
    const next = clips[index + 1];
    const clip = clips[index];
    if (next === undefined || clip === undefined) return undefined;
    if (clip.startFrame + clip.durationFrames !== next.startFrame) {
      return undefined;
    }
    return (
      <TransitionMark
        kind={choiceOf(next)}
        nextNumber={index + 2}
        isOpen={choosingInto === index + 1}
        onOpen={() => {
          setAddingAfter(undefined);
          setChoosingInto(choosingInto === index + 1 ? undefined : index + 1);
        }}
      />
    );
  };
  const dropSceneInChapter = (drop: { clipId: string; chapterId: string }) => {
    const card = film.cards.find((each) => each.clip.id === drop.clipId);
    if (card !== undefined) {
      chapterEdits.dropSceneInChapter({ card, chapterId: drop.chapterId });
    }
  };
  const cardOf = (card: ChapterCard) => (
    <SceneCard
      key={card.clip.id}
      card={cardFactsOf({ card, context })}
      over={over?.clipId === card.clip.id ? over.kind : undefined}
      drop={cardDropOf({
        card,
        film,
        chapterEdits,
        onDropItem: props.onDropItem,
        onOver: (kind) => {
          setOver(
            kind === undefined ? undefined : { clipId: card.clip.id, kind },
          );
        },
      })}
      onPick={() => {
        props.onPick(card.clip);
      }}
      onKeyMove={(step) => {
        keyMovedClipId.current = card.clip.id;
        chapterEdits.stepScene({ card, by: step });
      }}
      onAdd={() => {
        setChoosingInto(undefined);
        setAddingAfter(card.index);
      }}
      mark={markAfter(card.index)}
    />
  );
  return (
    <>
      <ol
        className="cards"
        aria-label="Scenes"
        ref={list}
        data-more-before={edges.hasMoreBefore}
        data-more-after={edges.hasMoreAfter}
      >
        {film.isSplit
          ? film.chapters.map((...[chapter, index]) => (
              <Fragment key={chapter.id}>
                {index === 0 ? undefined : (
                  <ChapterLine
                    film={film}
                    leftId={film.chapters[index - 1]?.id ?? ""}
                    edits={chapterEdits}
                  />
                )}
                <ChapterGroup
                  chapter={chapter}
                  onDropScene={dropSceneInChapter}
                >
                  {chapter.cards.map(cardOf)}
                </ChapterGroup>
              </Fragment>
            ))
          : film.cards.map(cardOf)}
      </ol>
      {choosingClip === undefined || choosingInto === undefined ? undefined : (
        <TransitionForm
          nextNumber={choosingInto + 1}
          current={choiceOf(choosingClip)}
          onPick={(kind) => {
            props.onTransition({ clip: choosingClip, kind });
          }}
          onClose={() => {
            setChoosingInto(undefined);
          }}
        />
      )}
      {addingAfter === undefined ? undefined : (
        <AddSceneForm
          afterNumber={addingAfter + 1}
          onAdd={(description) => {
            const before = neighborOf(addingAfter);
            setAddingAfter(undefined);
            if (before === undefined) return;
            props.onAddScene(
              newSceneRequest({
                description,
                before,
                after: neighborOf(addingAfter + 1),
              }),
            );
          }}
          onCancel={() => {
            setAddingAfter(undefined);
          }}
        />
      )}
    </>
  );
}
