import { normalizeSidebarRoute } from "./normalize-sidebar-route.mjs";
import { getCreativeDefaultSidebarBoxes } from "./page-sidebar-defaults.mjs";
import {
  buildDefaultPanelsSidebarBoxes,
  DEFAULT_RECORDING_SIDEBAR_BOXES,
  listSidebarBoxesForPage,
} from "./site-config-sidebar.mjs";

function cloneBoxes(boxes) {
  return boxes.map(({ kind, payload }) => ({
    kind,
    payload: JSON.parse(JSON.stringify(payload)),
  }));
}

/** Sidebar boxes for a single page route (DB row for that route, else defaults). */
export async function resolveSidebarBoxes(pageRoute) {
  const route = normalizeSidebarRoute(pageRoute);
  const fromDb = await listSidebarBoxesForPage(route);
  if (fromDb.length > 0) {
    return fromDb.map(({ kind, payload }) => ({ kind, payload }));
  }

  if (route === "/recording") {
    return cloneBoxes(DEFAULT_RECORDING_SIDEBAR_BOXES);
  }

  const creativeDefaults = getCreativeDefaultSidebarBoxes(route);
  if (creativeDefaults?.length) {
    return cloneBoxes(creativeDefaults);
  }

  return cloneBoxes(buildDefaultPanelsSidebarBoxes(route));
}
