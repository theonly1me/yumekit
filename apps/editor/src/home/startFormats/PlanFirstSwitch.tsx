export function PlanFirstSwitch(props: {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}) {
  return (
    <div className="plan-first">
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          aria-describedby="plan-first-line"
          checked={props.isOn}
          onChange={(event) => {
            props.onChange(event.currentTarget.checked);
          }}
        />{" "}
        Show me the plan first
      </label>
      <p className="fact" id="plan-first-line">
        The AI stops after the script and the pictures, so you can check them.
      </p>
    </div>
  );
}
