export const SIDEBAR_WIDTH_STEP_MIN = 0;
export const SIDEBAR_WIDTH_STEP_MAX = 10;
export const SIDEBAR_WIDTH_STEP_DEFAULT = 2;
export const SIDEBAR_WIDTH_PX_MIN = 300;
export const SIDEBAR_WIDTH_PX_MAX = 610;

export function clampSidebarWidthStep(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return SIDEBAR_WIDTH_STEP_DEFAULT;
  return Math.min(SIDEBAR_WIDTH_STEP_MAX, Math.max(SIDEBAR_WIDTH_STEP_MIN, Math.round(next)));
}

export function sidebarWidthPxFromStep(step) {
  const clamped = clampSidebarWidthStep(step);
  return Math.round(SIDEBAR_WIDTH_PX_MIN + clamped * ((SIDEBAR_WIDTH_PX_MAX - SIDEBAR_WIDTH_PX_MIN) / 10));
}
