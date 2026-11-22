import type { CSSProperties } from "react";
import type { ScenePicture } from "./useScenePictures.js";

function PictureContent(props: { picture: ScenePicture | undefined }) {
  const { picture } = props;
  if (picture === undefined) {
    return <span className="picture-words">Making the picture</span>;
  }
  if (picture.kind === "failed") {
    return <span className="picture-words">No picture</span>;
  }
  return <img src={picture.source} alt="" />;
}

export function PictureView(props: {
  picture: ScenePicture | undefined;
  shape: CSSProperties;
}) {
  return (
    <span className="picture" style={props.shape}>
      <PictureContent picture={props.picture} />
    </span>
  );
}
