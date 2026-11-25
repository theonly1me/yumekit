import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { FilmPicture } from "../../../film/FilmPicture.js";
import { filmMediaOf } from "../../../film/filmMedia.js";
import { contentBottomUnits } from "../../../kit/captionArea.js";
import { FitBox } from "../../../kit/FitBox.js";
import { useSizes } from "../../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../../kit/textStyles.js";
import { contrastRatio } from "../../../stylePacks/contrast.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";
import type { StylePack } from "../../../stylePacks/stylePack.js";
import { useCardTiming } from "./cardTiming.js";
import {
  readTrailerCardProps,
  type TrailerCardProps,
} from "./readTrailerCardProps.js";

const black = "#000000";
const warmWhite = "#f2eee6";
const readableContrast = 4.5;
const stillDarkening = 0.62;
const marginUnits = { wide: 13, square: 8, tall: 8 } as const;

function backgroundOf(options: {
  card: TrailerCardProps;
  stylePack: StylePack;
}): string {
  return options.card.background === "look"
    ? options.stylePack.colors.background
    : black;
}

function wordsColorOf(options: {
  card: TrailerCardProps;
  stylePack: StylePack;
  background: string;
}): string {
  if (options.card.color !== undefined) return options.card.color;
  const { text } = options.stylePack.colors;
  const reads =
    contrastRatio({ text, background: options.background }) >= readableContrast;
  return reads ? text : warmWhite;
}

function lineStyle(options: {
  card: TrailerCardProps;
  stylePack: StylePack;
  fontSize: string;
  color: string;
}): CSSProperties {
  const { card, stylePack } = options;
  return {
    ...(card.face === "display"
      ? displayTextStyle(stylePack)
      : bodyTextStyle(stylePack)),
    fontSize: options.fontSize,
    letterSpacing: `${String(card.tracking)}em`,
    textTransform: card.capitals ? "uppercase" : "none",
    lineHeight: 1.35,
    textAlign: "center",
    color: options.color,
    marginRight: `-${String(card.tracking)}em`,
  };
}

export function TrailerCard(props: { props: JsonObject }): ReactNode {
  const card = readTrailerCardProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const { findAsset } = useSceneContext();
  const timing = useCardTiming(card);
  const background = backgroundOf({ card, stylePack });
  const media = filmMediaOf({ findAsset, assetId: card.backgroundAssetId });
  const hasStill = media.kind !== "none";
  const color = wordsColorOf({
    card,
    stylePack,
    background: hasStill ? black : background,
  });
  const sizeOf = (role: "filmCard" | "filmTitle") =>
    sizes.fitted(sizes.textUnits(role) * card.scale);
  const roles: ("filmCard" | "filmTitle")[] =
    card.variant === "title"
      ? ["filmTitle", "filmCard"]
      : ["filmCard", "filmCard"];
  const margin = marginUnits[sizes.layout];
  const edge = contentBottomUnits(stylePack);
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background,
          overflow: "hidden",
        }}
      >
        {hasStill ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${String(timing.stillScale)})`,
            }}
          >
            <FilmPicture
              assetId={card.backgroundAssetId}
              media={media}
              assetFrame={0}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: black,
                opacity: stillDarkening,
              }}
            />
          </div>
        ) : null}
      </div>
      {timing.wordsShown ? (
        <FitBox
          style={{
            left: sizes.pixels(margin),
            right: sizes.pixels(margin),
            top: sizes.pixels(edge),
            bottom: sizes.pixels(edge),
            justifyContent: "center",
            alignItems: "center",
            opacity: timing.wordsOpacity,
            transform: `scale(${String(timing.wordsScale)})`,
          }}
        >
          {card.lines.map((...[line, index]) => (
            <p
              key={`${String(index)}-${line}`}
              data-text-prop={`lines.${String(index)}`}
              style={{
                ...lineStyle({
                  card,
                  stylePack,
                  fontSize: sizeOf(roles[index] ?? "filmCard"),
                  color,
                }),
                ...(index > 0 ? { marginTop: sizes.fitted(1.6) } : {}),
              }}
            >
              {line}
            </p>
          ))}
        </FitBox>
      ) : null}
      {timing.isFlashFrame ? (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: warmWhite }}
        />
      ) : null}
    </>
  );
}
