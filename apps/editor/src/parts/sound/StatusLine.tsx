import type { SoundStatus } from "./useSoundActions.js";

export function StatusLine(props: { status: SoundStatus }) {
  const { status } = props;
  return (
    <p
      className={status.kind === "failed" ? "change-failure" : "fact"}
      role={status.kind === "failed" ? "alert" : "status"}
    >
      {status.kind === "idle" ? "" : status.text}
    </p>
  );
}
