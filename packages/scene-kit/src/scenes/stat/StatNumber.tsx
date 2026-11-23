import type { CSSProperties, ReactNode } from "react";

const affixShare = 0.5;

function NumberText(props: {
  prefix: string | undefined;
  number: string;
  suffix: string | undefined;
  affixStyle: CSSProperties;
}): ReactNode {
  return (
    <>
      {props.prefix === undefined || props.prefix === "" ? null : (
        <span style={props.affixStyle}>{props.prefix}</span>
      )}
      {props.number}
      {props.suffix === undefined || props.suffix === "" ? null : (
        <span style={props.affixStyle}>{props.suffix}</span>
      )}
    </>
  );
}

export function StatNumber(props: {
  prefix: string | undefined;
  suffix: string | undefined;
  shown: string;
  settled: string;
  affixColor: string;
  style: CSSProperties;
  numberStyle: CSSProperties;
}): ReactNode {
  const affixStyle: CSSProperties = {
    fontSize: `${String(affixShare)}em`,
    color: props.affixColor,
    verticalAlign: "0.62em",
    marginInline: "0.04em",
  };
  const parts = { prefix: props.prefix, suffix: props.suffix, affixStyle };
  return (
    <div style={{ display: "grid", ...props.style }}>
      <p
        aria-hidden="true"
        style={{
          ...props.numberStyle,
          gridArea: "1 / 1",
          visibility: "hidden",
        }}
      >
        <NumberText {...parts} number={props.settled} />
      </p>
      <p style={{ ...props.numberStyle, gridArea: "1 / 1" }}>
        <NumberText {...parts} number={props.shown} />
      </p>
    </div>
  );
}
