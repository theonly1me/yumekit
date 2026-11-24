import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { boxStyle, useFilmGrid } from "../../../film/filmGrid.js";
import { useBeatFrames, useFilmTiming } from "../../../film/filmTiming.js";
import { FitBox } from "../../../kit/FitBox.js";
import { displayTextStyle } from "../../../kit/textStyles.js";
import { typed } from "../../../motion/index.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";
import { CommandPill } from "./CommandPill.js";
import { readCommandProps } from "./readCommandProps.js";

const typingStartBeat = 1.5;
const charactersPerSecond = 30;
const noteBeatsAfterTyping = 1;

export function Command(props: { props: JsonObject }): ReactNode {
  const { command, heading, note } = readCommandProps(props.props);
  const stylePack = useStylePack();
  const grid = useFilmGrid({ hasHeading: false });
  const pillBeat = heading === undefined ? 0 : 1;
  const typingBeat = pillBeat + typingStartBeat - 1;
  const { framesPerSecond } = useSceneContext();
  const typingSeconds = Array.from(command).length / charactersPerSecond;
  const typingBeats = (typingSeconds * framesPerSecond) / useBeatFrames();
  const noteBeat = Math.ceil(typingBeat + typingBeats) + noteBeatsAfterTyping;
  const timing = useFilmTiming(
    note === undefined
      ? { lastEntryBeat: typingBeat, tailSeconds: typingSeconds }
      : { lastEntryBeat: noteBeat },
  );
  const typing = typed({
    text: command,
    frame: timing.pacedFrame,
    framesPerSecond: timing.framesPerSecond,
    startFrame: timing.frameOfBeat(typingBeat),
    charactersPerSecond,
  });
  const { sizes } = grid;
  return (
    <FitBox
      style={{
        ...boxStyle(grid.content),
        justifyContent: "center",
        alignItems: "center",
      }}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: sizes.pixels(4),
      }}
    >
      {heading === undefined ? null : (
        <h2
          data-text-prop="heading"
          style={{
            ...displayTextStyle(stylePack),
            ...timing.enterAt(0),
            fontSize: sizes.text("filmWordmark"),
            lineHeight: 1,
            letterSpacing: "-0.035em",
            textAlign: "center",
          }}
        >
          {heading}
        </h2>
      )}
      <CommandPill
        command={command}
        shown={typing.shown}
        cursorVisible={typing.cursorVisible}
        motion={timing.enterAt(pillBeat)}
        sizes={sizes}
      />
      {note === undefined ? null : (
        <p
          data-text-prop="note"
          style={{
            ...timing.enterAt(noteBeat),
            margin: 0,
            fontSize: sizes.text("filmLabel"),
            color: stylePack.colors.mutedText,
            textAlign: "center",
          }}
        >
          {note}
        </p>
      )}
    </FitBox>
  );
}
