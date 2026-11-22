import {
  defineReactScene,
  type JsonObject,
  type SceneModule,
} from "@yumekit/scene";
import type { ReactNode } from "react";
import { Backdrop } from "../backdrops/Backdrop.js";
import { loadStylePackFonts } from "../stylePacks/loadStylePackFonts.js";
import { StylePackContext } from "../stylePacks/StylePackContext.js";
import { fontFamilyOf, type StylePack } from "../stylePacks/stylePack.js";

export type KitComponent = (props: { props: JsonObject }) => ReactNode;

export interface KitSceneDefinition {
  component: KitComponent;
  paintsBackground: boolean;
}

export function defineKitScene(options: {
  stylePack: StylePack;
  definition: KitSceneDefinition;
}): SceneModule {
  const { stylePack, definition } = options;
  const { component: Component } = definition;
  const reactScene = defineReactScene(({ props }) => (
    <StylePackContext value={stylePack}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: definition.paintsBackground
            ? stylePack.colors.background
            : "transparent",
          color: stylePack.colors.text,
          fontFamily: fontFamilyOf(stylePack.fonts.body),
          fontWeight: stylePack.fonts.body.weight,
        }}
      >
        {definition.paintsBackground ? (
          <Backdrop stylePack={stylePack} seed={JSON.stringify(props)} />
        ) : null}
        <Component props={props} />
      </div>
    </StylePackContext>
  ));
  return {
    mount: async (mountOptions) => {
      await loadStylePackFonts(stylePack);
      return reactScene.mount(mountOptions);
    },
  };
}
