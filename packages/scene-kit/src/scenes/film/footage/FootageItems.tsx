import type { ReactNode } from "react";
import type { FilmBox, FilmGrid } from "../../../film/filmGrid.js";
import { boxStyle } from "../../../film/filmGrid.js";
import type { FilmTiming } from "../../../film/filmTiming.js";
import { FitBox } from "../../../kit/FitBox.js";
import { bodyTextStyle } from "../../../kit/textStyles.js";
import { fitBox } from "../../../film/regionView.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";

const windowShareOfWidth = 0.6;
const rowShareOfText = 2.4;

export interface ItemsPlacement {
  box: FilmBox;
  items: FilmBox;
}

function rowHeightOf(grid: FilmGrid): number {
  return grid.sizes.textUnits("filmItem") * grid.sizes.unit * rowShareOfText;
}

export function placeWithItems(options: {
  grid: FilmGrid;
  aspect: number;
  labelHeight: number;
  itemCount: number;
}): ItemsPlacement {
  const { grid, aspect, labelHeight, itemCount } = options;
  const { media, gap } = grid;
  if (grid.sizes.layout === "wide") {
    const size = fitBox({
      aspect,
      width: media.width * windowShareOfWidth,
      height: media.height - labelHeight,
    });
    const box = { left: media.left, top: media.top, ...size };
    const itemsLeft = box.left + box.width + 2 * gap;
    return {
      box,
      items: {
        left: itemsLeft,
        top: box.top,
        width: media.left + media.width - itemsLeft,
        height: box.height,
      },
    };
  }
  const itemsHeight = itemCount * rowHeightOf(grid);
  const size = fitBox({
    aspect,
    width: media.width,
    height: media.height - itemsHeight - gap,
  });
  const box = { left: media.left, top: media.top, ...size };
  return {
    box,
    items: {
      left: media.left,
      top: box.top + box.height + gap,
      width: media.width,
      height: itemsHeight,
    },
  };
}

export function FootageItems(props: {
  items: string[];
  box: FilmBox;
  grid: FilmGrid;
  timing: FilmTiming;
  firstBeat: number;
}): ReactNode {
  const stylePack = useStylePack();
  const { grid } = props;
  const rule = `1px solid color-mix(in srgb, ${stylePack.colors.text} 16%, transparent)`;
  return (
    <div
      style={{
        ...boxStyle(props.box),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {props.items.map((...[item, index]) => (
        <FitBox
          key={`${String(index)}-${item}`}
          style={{
            position: "relative",
            justifyContent: "center",
            width: "100%",
            height: `${String(rowHeightOf(grid))}px`,
            borderTop: rule,
            borderBottom: index === props.items.length - 1 ? rule : "none",
            ...props.timing.enterAt(props.firstBeat + index),
          }}
        >
          <p
            data-text-prop={`items.${String(index)}`}
            style={{
              ...bodyTextStyle(stylePack),
              margin: 0,
              fontSize: grid.sizes.text("filmItem"),
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              color: stylePack.colors.text,
            }}
          >
            {item}
          </p>
        </FitBox>
      ))}
    </div>
  );
}
