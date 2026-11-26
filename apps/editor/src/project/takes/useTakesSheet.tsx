import { useState } from "react";
import { waitingTakesOf } from "@yumekit/project/takes";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { ReadyLines } from "../ready/ReadyLines.js";
import { TakesSheet } from "./TakesSheet.js";
import { chaptersOf } from "./verdicts.js";

export function useTakesSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  onOpen: () => void;
}) {
  const [shown, setShown] = useState<{
    takeId: string | undefined;
    chapterId?: string;
  }>();
  const takes = options.snapshot.takes ?? [];
  const open = (takeId: string | undefined) => {
    options.onOpen();
    setShown({ takeId });
  };
  return {
    isOpen: shown !== undefined,
    openLatest: () => {
      open(undefined);
    },
    openChapter: (chapterId: string) => {
      options.onOpen();
      setShown({ takeId: undefined, chapterId });
    },
    waitingCount: waitingTakesOf(takes).length,
    readyLines: (
      <ReadyLines
        takes={takes}
        chapters={chaptersOf(options.snapshot.bible.storyPlan)}
        onOpen={open}
      />
    ),
    sheet:
      shown === undefined ? undefined : (
        <TakesSheet
          client={options.client}
          snapshot={options.snapshot}
          takeId={shown.takeId}
          chapterId={shown.chapterId}
          onPick={open}
          onClose={() => {
            setShown(undefined);
          }}
        />
      ),
  };
}
