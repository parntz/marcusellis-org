import { isReservedAdminIdentity } from "./reserved-admins";

export function isAdminUser(user) {
  return isReservedAdminIdentity(user) || String(user?.role || "").trim().toLowerCase() === "admin";
}

export function isAdminSession(session) {
  return isAdminUser(session?.user);
}

export function getOwnedMemberPageId(user) {
  const raw = user?.memberPageId;
  if (raw == null || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function canEditMemberPage(user, memberPage) {
  if (isAdminUser(user)) {
    return true;
  }

  const ownedId = getOwnedMemberPageId(user);
  if (ownedId && Number(memberPage?.id) === ownedId) {
    return true;
  }

  const ownedSlug = String(user?.memberPageSlug || "").trim();
  return Boolean(ownedSlug && ownedSlug === String(memberPage?.slug || "").trim());
}
