import { button } from "./views.js";
import { session } from "./projects.js";
import { canReview, viewedTake } from "./takeHistory.js";
export function footer() {
  switch (session.page) {
    case "studio":
      return button({
        action: "create",
        label: "+ New project",
        style: "primary",
        disabled: !session.online,
      });
    case "create":
      return button({
        action: "start",
        label: "Start project",
        style: "primary",
        disabled: !session.draft.trim(),
      });
    case "review":
      if (!canReview(session.project)) return "";
      return button({
        action: "submit",
        label: Object.values(viewedTake(session.project).notes).some(Boolean)
          ? "Send take with changes"
          : "Approve take",
        style: "primary",
      });
    case "export":
      if (session.project.stage !== "Finished") return "";
      return button({ action: "share", label: "Share film", style: "primary" });
    case "connection":
      return button({
        action: "connect",
        label: session.paired
          ? session.online
            ? "Preview offline"
            : "Reconnect"
          : "Preview pairing",
        style: "primary",
      });
    default:
      return "";
  }
}
