import { DEFAULT_RECORDING_SIDEBAR_BOXES, listSidebarBoxesForPage } from "./site-config-sidebar.mjs";

/** Sidebar boxes for a page route (DB overrides, else recording-style defaults). */
export async function resolveSidebarBoxes(pageRoute, fallbackRoute = "") {
  const fromDb = await listSidebarBoxesForPage(pageRoute);
  if (fromDb.length > 0) {
    return fromDb.map(({ kind, payload }) => ({ kind, payload }));
  }

  if (fallbackRoute) {
    const fallback = await listSidebarBoxesForPage(fallbackRoute);
    if (fallback.length > 0) {
      return fallback.map(({ kind, payload }) => ({ kind, payload }));
    }
  }

  return DEFAULT_RECORDING_SIDEBAR_BOXES.map(({ kind, payload }) => ({
    kind,
    payload: JSON.parse(JSON.stringify(payload)),
  }));
}
