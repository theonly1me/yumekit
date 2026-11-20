import { text } from "node:stream/consumers";

const enterKeys = new Set(["\r", "\n"]);
const cancelKeys = new Set(["\u0003", "\u0004"]);
const eraseKeys = new Set(["\u007f", "\b"]);

export type SecretRead =
  { kind: "read"; value: string } | { kind: "cancelled" };

function readHiddenLine(prompt: string): Promise<SecretRead> {
  const input = process.stdin;
  process.stderr.write(prompt);
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    const finish = (result: SecretRead) => {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      process.stderr.write("\n");
      resolve(result);
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (enterKeys.has(character)) {
          finish({ kind: "read", value });
          return;
        }
        if (cancelKeys.has(character)) {
          finish({ kind: "cancelled" });
          return;
        }
        value = eraseKeys.has(character)
          ? value.slice(0, -1)
          : value + character;
      }
    };
    input.on("data", onData);
  });
}

export async function readSecret(variable: string): Promise<SecretRead> {
  if (process.stdin.isTTY) {
    return readHiddenLine(`Value of ${variable} (hidden): `);
  }
  const piped = await text(process.stdin);
  return { kind: "read", value: piped.replace(/\r?\n$/, "") };
}
