export function UseButton(props: {
  isPicked: boolean;
  canPick: boolean;
  onUse: () => void;
}) {
  return (
    <button
      type="button"
      className="use-this"
      aria-pressed={props.isPicked}
      disabled={!props.canPick}
      onClick={props.onUse}
    >
      Use this
    </button>
  );
}

export function UseRow(props: {
  canUse: boolean;
  isPicked: boolean;
  canPick: boolean;
  olderTake: number | undefined;
  onUse: () => void;
  onCompare: () => void;
}) {
  if (!props.canUse && props.olderTake === undefined) return undefined;
  return (
    <div className="use-row">
      {props.canUse ? (
        <UseButton
          isPicked={props.isPicked}
          canPick={props.canPick}
          onUse={props.onUse}
        />
      ) : undefined}
      {props.olderTake === undefined ? undefined : (
        <button
          type="button"
          className="link compare-link"
          onClick={props.onCompare}
        >
          Compare with take {props.olderTake}
        </button>
      )}
    </div>
  );
}
