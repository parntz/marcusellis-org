function isReservedAdminIdentity(user) {
  const username = String(user?.name || user?.username || "")
    .trim()
    .toLowerCase();
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();

  return username === "paularntz" || email === "paularntz" || email.startsWith("paularntz@");
}

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
