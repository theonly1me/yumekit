import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { takeTokenFromAddress } from "./engine/sessionToken.js";
import { readTheme } from "./shell/useTheme.js";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/editor.css";
import "./styles/scrub.css";
import "./styles/lower.css";
import "./styles/tracks.css";
import "./styles/side.css";
import "./styles/states.css";
import "./styles/narrow.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The page has no element with the id root.");
}

document.documentElement.dataset["theme"] = readTheme();
const token = takeTokenFromAddress();

createRoot(rootElement).render(
  <StrictMode>
    <App token={token} />
  </StrictMode>,
);
