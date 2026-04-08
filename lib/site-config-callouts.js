import { getClient } from "./sqlite.mjs";

const DEFAULT_CALLOUT_CONFIG = {
  delaySeconds: 8,
  enabled: true,
};

function normalizeDelaySeconds(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return DEFAULT_CALLOUT_CONFIG.delaySeconds;
  }
  return Math.max(2, Math.min(20, Math.round(value)));
}

function keyForLocation(location = "header") {
  return `callouts_${String(location || "header").trim() || "header"}`;
}

function normalizeCalloutConfig(parsed) {
  return {
    delaySeconds: normalizeDelaySeconds(parsed?.delaySeconds),
    enabled: parsed?.enabled !== false,
  };
}

export async function getCalloutConfig(location = "header") {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: "SELECT value FROM site_config WHERE key = ?",
      args: [keyForLocation(location)],
    });
    const row = rs.rows[0];
    if (!row?.value) {
      return { ...DEFAULT_CALLOUT_CONFIG };
    }
    return normalizeCalloutConfig(JSON.parse(String(row.value)));
  } catch {
    return { ...DEFAULT_CALLOUT_CONFIG };
  }
}

export async function setCalloutConfig(location = "header", config = {}) {
  const normalized = normalizeCalloutConfig(config);
  const client = getClient();
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [keyForLocation(location), JSON.stringify(normalized)],
  });
  return normalized;
}

export { DEFAULT_CALLOUT_CONFIG };
