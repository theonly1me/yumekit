const localHosts = ["127.0.0.1", "localhost", "::1", "[::1]"];

const declaredHosts = new Set<string>();

const blockedRequests: string[] = [];

export function allowTestHosts(hosts: string[]): void {
  hosts.forEach((host) => declaredHosts.add(host));
}

export function takeBlockedRequests(): string[] {
  return blockedRequests.splice(0);
}

export function blockedRequestMessage(url: string): string {
  return `A test asked for ${url}. No test may reach a real service, because a media service costs money. Answer the request with a local test server on 127.0.0.1, or declare the host with allowTestHosts when the test answers it itself.`;
}

function urlOf(options: {
  input: Parameters<typeof fetch>[0];
  base: string;
}): URL {
  const { input } = options;
  const text =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return new URL(text, options.base);
}

export function installFetchGuard(options: { base: string; ownHost?: string }) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (...[input, init]: Parameters<typeof fetch>) => {
    const url = urlOf({ input, base: options.base });
    const isAllowed =
      localHosts.includes(url.hostname) ||
      url.hostname === options.ownHost ||
      declaredHosts.has(url.hostname);
    if (isAllowed) return realFetch(input, init);
    blockedRequests.push(url.href);
    return Promise.reject(new Error(blockedRequestMessage(url.href)));
  };
}
