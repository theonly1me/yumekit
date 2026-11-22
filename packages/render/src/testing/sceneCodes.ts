export const movingSquareCode = `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { output } = useSceneContext();
  const color = typeof props.color === "string" ? props.color : "#ff0000";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000" }}>
      <div
        style={{
          position: "absolute",
          left: frame * 10,
          top: output.heightPixels / 2 - 20,
          width: 40,
          height: 40,
          background: color,
        }}
      />
    </div>
  );
});
`;

export const solidColorCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const color = typeof props.color === "string" ? props.color : "#0000ff";
  return <div style={{ position: "absolute", inset: 0, background: color }} />;
});
`;

export const guardedRandomCode = `import { defineReactScene, useFrame } from "@yumekit/scene";

export default defineReactScene(() => {
  const frame = useFrame();
  const red = Math.floor(Math.random() * 256);
  const stamp = new Date().getTime() % 256;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: \`rgb(\${String(red)}, \${String(stamp)}, \${String(frame)})\`,
      }}
    />
  );
});
`;

export const unguardedRandomCode = `import { defineReactScene } from "@yumekit/scene";

const drawnValues = new Set<number>();

function unseenRandomByte(): number {
  const [value = 0] = crypto.getRandomValues(new Uint8Array(1));
  return drawnValues.has(value) ? unseenRandomByte() : value;
}

export default defineReactScene(() => {
  const value = unseenRandomByte();
  drawnValues.add(value);
  return <div style={{ position: "absolute", inset: 0, background: \`rgb(\${String(value)}, 0, 0)\` }} />;
});
`;

export const callOrderCode = `import { defineReactScene } from "@yumekit/scene";

let seekCount = 0;

export default defineReactScene(() => {
  seekCount += 1;
  return <div style={{ position: "absolute", inset: 0, background: \`rgb(\${String(seekCount * 40 % 256)}, 0, 0)\` }} />;
});
`;

export const throwingCode = `import { defineReactScene, useFrame } from "@yumekit/scene";

export default defineReactScene(() => {
  const frame = useFrame();
  if (frame >= 2) {
    throw new Error("The scene broke at frame " + String(frame));
  }
  return <p>fine</p>;
});
`;

export const loggingCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => {
  console.error("The scene data is missing");
  return <p>logged</p>;
});
`;

export const notPermittedImportCode = `import { readFile } from "node:fs/promises";
import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => <p>{String(readFile)}</p>);
`;

export const syntaxErrorCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => {
  return <p>missing close</div>;
});
`;
