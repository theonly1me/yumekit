import type { ActionId, NextAction } from "./nextAction.js";

export function NextActionBar(props: {
  action: NextAction;
  isBusy: boolean;
  failure: string | undefined;
  onAction: (id: ActionId) => void;
}) {
  const { action } = props;
  return (
    <footer className="work-foot">
      <div className="foot-words">
        <p className="fact">{action.line}</p>
        {props.failure === undefined ? undefined : (
          <p className="fact change-failure" role="alert">
            {props.failure}
          </p>
        )}
      </div>
      {action.buttons.length === 0 ? undefined : (
        <div className="foot-actions">
          {action.buttons.map((button) => (
            <button
              key={button.id}
              type="button"
              className={button.isPrimary ? "primary" : undefined}
              disabled={props.isBusy}
              aria-busy={props.isBusy && button.isPrimary}
              onClick={() => {
                props.onAction(button.id);
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
    </footer>
  );
}
