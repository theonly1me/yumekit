import { agentRoutes } from "./agentRoutes.js";
import { chatRoutes } from "./chatRoutes.js";
import type { Route } from "./exchange.js";
import { fileRoutes } from "./fileRoutes.js";
import { keyRoutes } from "./keyRoutes.js";
import { projectRoutes } from "./projectRoutes.js";
import { settingsRoutes } from "./settingsRoutes.js";

export const engineRoutes: Route[] = [
  ...projectRoutes,
  ...keyRoutes,
  ...fileRoutes,
  ...agentRoutes,
  ...chatRoutes,
  ...settingsRoutes,
];
