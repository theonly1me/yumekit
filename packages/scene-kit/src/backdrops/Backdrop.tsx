import type { ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import type { BackdropKind, StylePack } from "../stylePacks/stylePack.js";
import { GlowBackdrop } from "./GlowBackdrop.js";
import { GrainBackdrop } from "./GrainBackdrop.js";
import { GridBackdrop } from "./GridBackdrop.js";

export function Backdrop(props: {
  kind?: BackdropKind;
  seed?: string;
  stylePack?: StylePack;
}): ReactNode {
  const contextStylePack = useStylePack();
  const stylePack = props.stylePack ?? contextStylePack;
  const kind = props.kind ?? stylePack.backdrop;
  const seed = props.seed ?? "backdrop";
  return (
    <div
      aria-hidden="true"
      data-backdrop={kind}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: stylePack.colors.background,
      }}
    >
      {kind === "glow" ? (
        <GlowBackdrop stylePack={stylePack} seed={seed} />
      ) : null}
      {kind === "grid" ? <GridBackdrop stylePack={stylePack} /> : null}
      {kind === "grain" ? <GrainBackdrop seed={seed} /> : null}
    </div>
  );
}
