import type { AskInput } from "./chatRequests.js";
import { NoticeView, type NoticeAction } from "./NoticeView.js";
import type { StartFailure } from "./useChat.js";

const kindsWithoutRetry = new Set([
  "no-agent",
  "settings-not-valid",
  "chat-busy",
]);

export function StartFailureView(props: {
  failure: StartFailure;
  isRunning: boolean;
  onSend: (input: AskInput) => void;
  onOpenAiSettings: () => void;
}) {
  const { failure } = props;
  const actions: NoticeAction[] = [];
  if (failure.kind === "no-agent") {
    actions.push({ label: "Open Settings", onAction: props.onOpenAiSettings });
  }
  if (!kindsWithoutRetry.has(failure.kind) && !props.isRunning) {
    actions.push({
      label: "Try again",
      onAction: () => {
        props.onSend(failure.retry);
      },
    });
  }
  return <NoticeView text={failure.message} actions={actions} isAlert />;
}
