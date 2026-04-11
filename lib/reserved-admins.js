export const RESERVED_ADMIN_ACCOUNTS = [
  {
    username: "paularntz",
    email: "paularntz@local",
    password: "APdaGnd26!23",
  },
  {
    username: "davepomeroy",
    email: "davepomeroy@local",
    password: "thebeast",
  },
];

export function getReservedAdminAccount(identifier = "") {
  const normalized = String(identifier || "").trim().toLowerCase();
  if (!normalized) return null;

  return (
    RESERVED_ADMIN_ACCOUNTS.find(
      (account) =>
        normalized === account.username ||
        normalized === account.email ||
        normalized.startsWith(`${account.username}@`)
    ) || null
  );
}

export function isReservedAdminPasswordMatch(identifier = "", password = "") {
  const account = getReservedAdminAccount(identifier);
  if (!account) return false;
  return String(password || "") === account.password;
}

export function isReservedAdminIdentity(user) {
  const username = String(user?.name || user?.username || "")
    .trim()
    .toLowerCase();
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();

  return RESERVED_ADMIN_ACCOUNTS.some(
    (account) =>
      username === account.username ||
      email === account.email ||
      email.startsWith(`${account.username}@`)
  );
}
