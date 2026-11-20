import { useFrame, useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { CaptionPanel } from "../kit/CaptionPanel.js";
import { readCaptionWordsProps } from "../props/readProps.js";
import { pageAt, pagesOf, timedWordsOf } from "./captionPages.js";

const pageCharactersByLayout = { wide: 60, square: 34, tall: 30 } as const;

export function CaptionWords(props: { props: JsonObject }): ReactNode {
  const { assetId, text } = readCaptionWordsProps(props.props);
  const frame = useFrame();
  const { durationFrames, findAsset, layout } = useSceneContext();
  const asset = assetId === undefined ? undefined : findAsset(assetId);
  const words = timedWordsOf({ words: asset?.words, text, durationFrames });
  const page = pageAt({
    pages: pagesOf({ words, maxCharacters: pageCharactersByLayout[layout] }),
    frame,
  });
  if (page === undefined) {
    return null;
  }
  const spokenWords = page
    .filter((word) => word.startFrame <= frame)
    .map((word) => word.text);
  return (
    <CaptionPanel placement="bottom">
      {[...spokenWords.entries()].map(([index, word]) => (
        <span key={String(index)}>{index === 0 ? word : ` ${word}`}</span>
      ))}
    </CaptionPanel>
  );
}
