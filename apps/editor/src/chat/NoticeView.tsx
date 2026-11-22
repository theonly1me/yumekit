export interface NoticeAction {
  label: string;
  onAction: () => void;
}

export function NoticeView(props: {
  text: string;
  actions: NoticeAction[];
  isAlert: boolean;
}) {
  return (
    <li className="entry notice" role={props.isAlert ? "alert" : undefined}>
      <p>{props.text}</p>
      {props.actions.length === 0 ? undefined : (
        <div className="notice-actions">
          {props.actions.map((action) => (
            <button key={action.label} type="button" onClick={action.onAction}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
