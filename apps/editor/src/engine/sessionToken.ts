const tokenKey = "yumekit-session-token";

function readStoredToken(): string | undefined {
  try {
    return window.sessionStorage.getItem(tokenKey) ?? undefined;
  } catch {
    return undefined;
  }
}

function storeToken(token: string): void {
  try {
    window.sessionStorage.setItem(tokenKey, token);
  } catch {
    return;
  }
}

export function takeTokenFromAddress(): string | undefined {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token === null) return readStoredToken();
  url.searchParams.delete("token");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  storeToken(token);
  return token;
}
