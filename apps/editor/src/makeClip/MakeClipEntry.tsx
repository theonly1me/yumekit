import type { Scene } from "../engine/snapshot.js";

const videoComponent = "video-clip";

export function MakeClipEntry(props: { scene: Scene; onOpen: () => void }) {
  const { source } = props.scene;
  const isVideo = source.kind === "kit" && source.component === videoComponent;
  return (
    <div className="group">
      <h3>Picture</h3>
      <p className="fact">
        {isVideo
          ? "A clip from a video model. Make it again with another model or other settings."
          : "Drawn from code. A video model can make this scene as a real clip."}
      </p>
      <button type="button" onClick={props.onOpen}>
        Make a clip for this scene
      </button>
    </div>
  );
}
