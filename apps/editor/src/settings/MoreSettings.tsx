import { useState, type ReactNode } from "react";

export function MoreSettings(props: {
  isOpenAtStart: boolean;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(props.isOpenAtStart);
  return (
    <details
      className="more"
      open={isOpen}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary>More settings</summary>
      <div className="more-body">{props.children}</div>
    </details>
  );
}
