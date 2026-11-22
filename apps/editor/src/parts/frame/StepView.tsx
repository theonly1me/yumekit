import { MusicView } from "../music/MusicView.js";
import { PicturesView } from "../pictures/PicturesView.js";
import { ScriptView } from "../script/ScriptView.js";
import { VoiceView } from "../voice/VoiceView.js";
import { StepFrame } from "./StepFrame.js";
import {
  stepViewTitles,
  type StepViewId,
  type StepViewProps,
} from "./stepViewProps.js";

function StepBody(props: StepViewProps & { stepId: StepViewId }) {
  const { stepId, ...view } = props;
  switch (stepId) {
    case "script":
      return <ScriptView {...view} />;
    case "pictures":
      return <PicturesView {...view} />;
    case "voice":
      return <VoiceView {...view} />;
    case "music":
      return <MusicView {...view} />;
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
