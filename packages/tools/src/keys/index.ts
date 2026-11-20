import type { Outcome } from "../types.js";
import { readKeyFile, writeKeyFile, type KeyValues } from "./keyFile.js";

export interface KeyState {
  variable: string;
  source: "environment" | "key-file" | "missing";
}

export type KeyFailure =
  | { kind: "key-not-valid"; variable: string; message: string }
  | { kind: "key-file-not-writable"; file: string; message: string };

const variablePattern = /^[A-Z][A-Z0-9_]{1,63}$/;

function environmentValue(variable: string): string | undefined {
  const value = process.env[variable];
  return value === undefined || value === "" ? undefined : value;
}

async function readableKeyValues(): Promise<KeyValues> {
  const read = await readKeyFile();
  return read.ok ? read.value : {};
}

export async function readKeyStates(options: {
  variables: string[];
}): Promise<KeyState[]> {
  const fileValues = await readableKeyValues();
  return options.variables.map((variable) => ({
    variable,
    source:
      environmentValue(variable) !== undefined
        ? "environment"
        : fileValues[variable] !== undefined
          ? "key-file"
          : "missing",
  }));
}

export async function keyValuesOf(options: {
  variables: string[];
}): Promise<KeyValues> {
  const fileValues = await readableKeyValues();
  const values: KeyValues = {};
  for (const variable of options.variables) {
    const value = environmentValue(variable) ?? fileValues[variable];
    if (value !== undefined) values[variable] = value;
  }
  return values;
}

function variableFailure(variable: string): KeyFailure | undefined {
  if (variablePattern.test(variable)) return undefined;
  return {
    kind: "key-not-valid",
    variable,
    message: `The name "${variable}" must match ${variablePattern.source}.`,
  };
}

function valueFailure(options: {
  variable: string;
  value: string;
}): KeyFailure | undefined {
  const { variable, value } = options;
  if (value === "") {
    return { kind: "key-not-valid", variable, message: "The value is empty." };
  }
  if (/[\r\n]/.test(value)) {
    return {
      kind: "key-not-valid",
      variable,
      message: "The value has a line break.",
    };
  }
  return undefined;
}

async function changeKeyFile(
  change: (values: KeyValues) => KeyValues | undefined,
): Promise<Outcome<{ changed: boolean }, KeyFailure>> {
  const read = await readKeyFile();
  if (!read.ok) {
    return {
      ok: false,
      failure: { kind: "key-file-not-writable", ...read.failure },
    };
  }
  const changed = change(read.value);
  if (changed === undefined) return { ok: true, value: { changed: false } };
  const written = await writeKeyFile(changed);
  if (!written.ok) {
    return {
      ok: false,
      failure: { kind: "key-file-not-writable", ...written.failure },
    };
  }
  return { ok: true, value: { changed: true } };
}

export async function saveKey(options: {
  variable: string;
  value: string;
}): Promise<Outcome<{ saved: true }, KeyFailure>> {
  const failure = variableFailure(options.variable) ?? valueFailure(options);
  if (failure) return { ok: false, failure };
  const changed = await changeKeyFile((values) => ({
    ...values,
    [options.variable]: options.value,
  }));
  return changed.ok ? { ok: true, value: { saved: true } } : changed;
}

export async function removeKey(options: {
  variable: string;
}): Promise<Outcome<{ removed: boolean }, KeyFailure>> {
  const failure = variableFailure(options.variable);
  if (failure) return { ok: false, failure };
  const changed = await changeKeyFile((values) => {
    if (values[options.variable] === undefined) return undefined;
    return Object.fromEntries(
      Object.entries(values).filter(([name]) => name !== options.variable),
    );
  });
  return changed.ok
    ? { ok: true, value: { removed: changed.value.changed } }
    : changed;
}
