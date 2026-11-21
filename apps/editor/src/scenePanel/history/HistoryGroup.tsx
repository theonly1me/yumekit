import type { History } from "./useHistory.js";

const isApple = /Mac|iPhone|iPad/.test(navigator.userAgent);
const commandKey = isApple ? "Cmd" : "Ctrl";

export function HistoryGroup(props: { history: History }) {
  const { history } = props;
  return (
    <div className="group">
      <h3>History</h3>
      <p className="fact">
        Each change, by you or by your agent, is one step. {commandKey}+Z undoes
        it, and Shift+{commandKey}+Z does it again.
      </p>
      <div className="history-actions">
        <button
          type="button"
          onClick={() => {
            history.step("undo");
          }}
        >
          Undo last change
        </button>
        <button
          type="button"
          onClick={() => {
            history.step("redo");
          }}
        >
          Redo last change
        </button>
      </div>
      <p className="fact" role="status">
        {history.message}
      </p>
    </div>
  );
}
