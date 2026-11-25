import { afterEach } from "vitest";
import {
  blockedRequestMessage,
  installFetchGuard,
  takeBlockedRequests,
} from "./fetchGuard.js";

const page = new URL(String(Reflect.get(globalThis, "location")));

installFetchGuard({ base: page.href, ownHost: page.hostname });

afterEach(() => {
  const [first] = takeBlockedRequests();
  if (first !== undefined) throw new Error(blockedRequestMessage(first));
});
