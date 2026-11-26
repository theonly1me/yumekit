import { agentRoutes } from "./agentRoutes.js";
import { chatRoutes } from "./chatRoutes.js";
import { clockRoutes } from "./clockRoutes.js";
import type { Route } from "./exchange.js";
import { fileRoutes } from "./fileRoutes.js";
import { keyRoutes } from "./keyRoutes.js";
import { mediaChoiceRoutes } from "./mediaChoiceRoutes.js";
import { mediaLimitRoutes } from "./mediaLimitRoutes.js";
import { mediaPrepareRoutes } from "./mediaPrepareRoutes.js";
import { mediaRequestRoutes } from "./mediaRequestRoutes.js";
import { moneyRoutes } from "./moneyRoutes.js";
import { projectRoutes } from "./projectRoutes.js";
import { settingsRoutes } from "./settingsRoutes.js";
import { takeDraftRoutes } from "./takeDraftRoutes.js";
import { takeRoutes } from "./takeRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";
import { workRoutes } from "./workRoutes.js";

export const engineRoutes: Route[] = [
  ...projectRoutes,
  ...keyRoutes,
  ...mediaChoiceRoutes,
  ...mediaLimitRoutes,
  ...mediaPrepareRoutes,
  ...mediaRequestRoutes,
  ...fileRoutes,
  ...agentRoutes,
  ...chatRoutes,
  ...moneyRoutes,
  ...settingsRoutes,
  ...uploadRoutes,
  ...workRoutes,
  ...clockRoutes,
  ...takeRoutes,
  ...takeDraftRoutes,
];
