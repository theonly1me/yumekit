export function takeTokenFromAddress(): string | undefined {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token === null) return undefined;
  url.searchParams.delete("token");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  return token;
}
