/** CustomEvent on `window`; consumed by `DbSaveToastHost`. */

export const DB_TOAST_EVENT = "afm-db-save-toast";

export function showDbToastSuccess(message = "Saved to database.") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DB_TOAST_EVENT, { detail: { variant: "success", message: String(message) } })
  );
}

export function showDbToastError(message = "Database update failed.") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DB_TOAST_EVENT, { detail: { variant: "error", message: String(message) } })
  );
}
