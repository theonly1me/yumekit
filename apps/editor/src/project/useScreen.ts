import { useEffect, useState } from "react";

export type Screen = "project" | "editor";

export const editorHash = "#edit";

function screenOfAddress(): Screen {
  return window.location.hash === editorHash ? "editor" : "project";
}

export function useScreen() {
  const [screen, setScreen] = useState<Screen>(screenOfAddress);

  useEffect(() => {
    const onChange = () => {
      setScreen(screenOfAddress());
    };
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  return {
    screen,
    go: (next: Screen) => {
      const { pathname, search } = window.location;
      const hash = next === "editor" ? editorHash : "";
      window.history.pushState(null, "", `${pathname}${search}${hash}`);
      window.scrollTo({ top: 0 });
      setScreen(next);
    },
  };
}
