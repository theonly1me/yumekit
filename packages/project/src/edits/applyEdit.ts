import type { ProjectState } from "../format/state.js";
import { setAssetMarks } from "./assetMarks.js";
import { addAsset, removeAsset, setAssetWords } from "./assets.js";
import { addClip, removeClip, updateClip } from "./clips.js";
import type { Edit } from "./edit.js";
import type { EditResult } from "./editFailure.js";
import { putSharedCode, setFonts, setTempo } from "./filmSettings.js";
import { setLook } from "./look.js";
import { setOutputPlatforms } from "./outputPlatforms.js";
import { putScene, removeScene } from "./scenes.js";
import {
  addOutput,
  removeOutput,
  setBible,
  setProjectName,
  setScript,
  setVideoStyle,
} from "./story.js";
import { copyTimeline, setTimeline } from "./timelines.js";

export async function applyEdit(options: {
  state: ProjectState;
  edit: Edit;
  folder: string;
}): Promise<EditResult> {
  const { state, edit, folder } = options;
  switch (edit.kind) {
    case "setProjectName":
      return setProjectName({ state, edit });
    case "addOutput":
      return addOutput({ state, edit });
    case "removeOutput":
      return removeOutput({ state, edit });
    case "setOutputPlatforms":
      return setOutputPlatforms({ state, edit });
    case "setVideoStyle":
      return setVideoStyle({ state, edit });
    case "setLook":
      return setLook({ state, edit });
    case "setTempo":
      return setTempo({ state, edit });
    case "setFonts":
      return setFonts({ state, edit });
    case "putSharedCode":
      return putSharedCode({ state, edit });
    case "setScript":
      return setScript({ state, edit });
    case "setBible":
      return setBible({ state, edit });
    case "putScene":
      return putScene({ state, edit });
    case "removeScene":
      return removeScene({ state, edit });
    case "addAsset":
      return addAsset({ state, edit, folder });
    case "setAssetWords":
      return setAssetWords({ state, edit });
    case "setAssetMarks":
      return setAssetMarks({ state, edit });
    case "removeAsset":
      return removeAsset({ state, edit });
    case "setTimeline":
      return setTimeline({ state, edit });
    case "addClip":
      return addClip({ state, edit });
    case "updateClip":
      return updateClip({ state, edit });
    case "removeClip":
      return removeClip({ state, edit });
    case "copyTimeline":
      return copyTimeline({ state, edit });
  }
}
