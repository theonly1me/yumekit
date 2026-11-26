import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";

const startFunctions = [
  "spawn",
  "spawnSync",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "fork",
] as const;

const blockedPrograms: string[] = [];

export function takeBlockedPrograms(): string[] {
  return blockedPrograms.splice(0);
}

export function blockedProgramMessage(program: string): string {
  return `A unit test started ${program}. A unit test runs in the test process only. Rename the test file to end in .e2e.test.ts, so that pnpm test:e2e runs it.`;
}

export function installProgramGuard(): void {
  for (const name of startFunctions) {
    Reflect.set(childProcess, name, (...parameters: unknown[]) => {
      const [program] = parameters;
      blockedPrograms.push(String(program));
      throw new Error(blockedProgramMessage(String(program)));
    });
  }
  syncBuiltinESMExports();
}
