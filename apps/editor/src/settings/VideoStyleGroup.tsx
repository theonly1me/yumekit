import { useState, type ReactNode } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { changeProject } from "../scenes/directChange.js";
import { VideoStyleChoices } from "../videoStyle/VideoStyleChoices.js";
import { usesAiVideo, type VideoStyleId } from "../videoStyle/videoStyles.js";

export function VideoStyleGroup(props: {
  client: EngineClient;
  videoStyle: VideoStyleId;
  children?: ReactNode;
}) {
  const [isSaving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string>();
  const choose = async (videoStyle: VideoStyleId) => {
    if (videoStyle === props.videoStyle) return;
    setSaving(true);
    setFailure(undefined);
    const outcome = await changeProject({
      client: props.client,
      name: "set_video_style",
      input: { video_style: videoStyle },
    }).catch(() => ({
      kind: "failed" as const,
      message: "yumekit could not save the choice.",
    }));
    setSaving(false);
    if (outcome.kind === "failed") setFailure(outcome.message);
  };
  return (
    <section className="setting-group" aria-labelledby="this-video-title">
      <h3 id="this-video-title">This video</h3>
      <p className="fact">
        How the video is made. The AI follows this choice in the next request.
      </p>
      <VideoStyleChoices
        chosen={props.videoStyle}
        isOff={isSaving}
        onChoose={(videoStyle) => {
          choose(videoStyle).catch(() => undefined);
        }}
      />
      {usesAiVideo(props.videoStyle) ? (
        <p className="fact">
          AI video stays inside the limits above. Each second of AI video costs
          money.
        </p>
      ) : undefined}
      {failure === undefined ? undefined : (
        <p className="fact change-failure" role="alert">
          {failure}
        </p>
      )}
      {props.children}
    </section>
  );
}
