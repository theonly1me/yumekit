import type { Scene } from "../engine/snapshot.js";
import { isVideoScene } from "../scenes/SceneCards.js";

export function MakeClipEntry(props: { scene: Scene; onOpen: () => void }) {
  const isVideo = isVideoScene(props.scene);
  return (
    <div className="group">
      <h3>Picture</h3>
      <p className="fact">
        {isVideo
          ? "This scene shows a video clip. Make it again with another model or other settings."
          : "This scene shows a still picture. A video model can make it as a real video clip."}
      </p>
      <button type="button" onClick={props.onOpen}>
        Make a real video clip
      </button>
    </div>
  );
}
