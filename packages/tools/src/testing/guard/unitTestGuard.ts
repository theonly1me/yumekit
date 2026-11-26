import { afterEach } from "vitest";
import {
  blockedProgramMessage,
  installProgramGuard,
  takeBlockedPrograms,
} from "./programGuard.js";

installProgramGuard();

afterEach(() => {
  const [first] = takeBlockedPrograms();
  if (first !== undefined) throw new Error(blockedProgramMessage(first));
});
