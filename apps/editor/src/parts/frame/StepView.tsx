import { lazy, Suspense } from "react";
import { FilesView } from "../files/FilesView.js";
import { MusicView } from "../music/MusicView.js";
import { PicturesView } from "../pictures/PicturesView.js";
import { VoiceView } from "../voice/VoiceView.js";
import { StepFrame } from "./StepFrame.js";
import {
  stepViewTitles,
  type StepViewId,
  type StepViewProps,
} from "./stepViewProps.js";

const ScriptView = lazy(() =>
  import("../script/ScriptView.js").then((module) => ({
    default: module.ScriptView,
  })),
);

export const loadingScriptText = "Loading the script.";

function StepBody(props: StepViewProps & { stepId: StepViewId }) {
  const { stepId, ...view } = props;
  switch (stepId) {
    case "script":
      return (
        <Suspense
          fallback={
            <p className="fact lead" role="status">
              {loadingScriptText}
            </p>
          }
        >
          <ScriptView {...view} />
        </Suspense>
      );
    case "pictures":
      return <PicturesView {...view} />;
    case "voice":
      return <VoiceView {...view} />;
    case "music":
      return <MusicView {...view} />;
    case "files":
      return <FilesView {...view} />;
  }
}

export function StepView(
  props: StepViewProps & { stepId: StepViewId; onStop?: () => void },
) {
  const { onStop, ...view } = props;
  return (
    <StepFrame
      title={stepViewTitles[props.stepId]}
      titleId={`step-view-${props.stepId}`}
      locked={props.locked}
      onStop={onStop}
    >
      <StepBody {...view} />
    </StepFrame>
  );
}
