import { agentRoutes } from "./agentRoutes.js";
import { chatRoutes } from "./chatRoutes.js";
import type { Route } from "./exchange.js";
import { fileRoutes } from "./fileRoutes.js";
import { keyRoutes } from "./keyRoutes.js";
import { mediaChoiceRoutes } from "./mediaChoiceRoutes.js";
import { mediaLimitRoutes } from "./mediaLimitRoutes.js";
import { projectRoutes } from "./projectRoutes.js";
import { settingsRoutes } from "./settingsRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";

export const engineRoutes: Route[] = [
  ...projectRoutes,
  ...keyRoutes,
  ...mediaChoiceRoutes,
  ...mediaLimitRoutes,
  ...fileRoutes,
  ...agentRoutes,
  ...chatRoutes,
  ...settingsRoutes,
  ...uploadRoutes,
];
