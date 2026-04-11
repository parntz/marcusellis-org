import "../../scripts/load-env.mjs";
import { sendResendEmail } from "../../lib/resend-mail.js";
import { closeDb } from "../../lib/sqlite.mjs";
import { runMemberMediaDiscovery } from "../../lib/member-media-discovery.mjs";

export const config = {
  schedule: "0 3 * * *",
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function readEnv(name) {
  const value = String(process.env[name] || "").trim();
  return value && value.toLowerCase() !== "undefined" ? value : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getReportRecipient() {
  return readEnv("MEMBER_MEDIA_DISCOVERY_REPORT_TO") || "paul@paularntz.com";
}

function getSiteOrigin() {
  return (
    readEnv("SITE_URL") ||
    readEnv("URL") ||
    readEnv("DEPLOY_PRIME_URL") ||
    "https://afm257.netlify.app"
  ).replace(/\/+$/, "");
}

function buildGalleryUrl(slug) {
  return `${getSiteOrigin()}/media/photo-gallery/${encodeURIComponent(String(slug || "").trim())}`;
}

function buildEmailSubject(result) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `Nightly member media discovery report - ${date}`;
}

function buildInsertedVideosHtml(items) {
  if (!Array.isArray(items) || !items.length) {
    return `
      <div style="margin-top:24px;padding:18px 20px;border:1px solid #233046;border-radius:16px;background:#0f1724;">
        <h2 style="margin:0 0 8px;color:#f8fafc;font:600 18px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">New videos inserted</h2>
        <p style="margin:0;color:#cbd5e1;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">No new video pages were inserted during this run.</p>
      </div>
    `;
  }

  const rows = items
    .map((item) => {
      const title = escapeHtml(item?.title || item?.slug || "Untitled video");
      const href = escapeHtml(buildGalleryUrl(item?.slug));
      return `
        <tr>
          <td style="padding:12px 0;border-top:1px solid #233046;">
            <a href="${href}" style="color:#7dd3fc;text-decoration:none;font:600 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${title}</a>
            <div style="margin-top:4px;color:#94a3b8;font:400 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${href}</div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin-top:24px;padding:18px 20px;border:1px solid #233046;border-radius:16px;background:#0f1724;">
      <h2 style="margin:0 0 10px;color:#f8fafc;font:600 18px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">New videos inserted</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildReportEmail(result) {
  const stats = [
    ["Members processed", result?.membersProcessed ?? 0],
    ["Candidates found", result?.candidatesFound ?? 0],
    ["Approved", result?.approved ?? 0],
    ["Pending review", result?.pending ?? 0],
    ["Auto-rejected", result?.autoRejected ?? 0],
    ["Inserted", result?.inserted ?? 0],
    ["Updated", result?.updated ?? 0],
    ["Cursor before", result?.cursorBefore ?? 0],
    ["Cursor after", result?.cursorAfter ?? 0],
  ];

  const statCards = stats
    .map(
      ([label, value]) => `
        <div style="min-width:160px;flex:1 1 160px;padding:16px 18px;border-radius:14px;background:#0f1724;border:1px solid #233046;">
          <div style="color:#94a3b8;font:500 12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(label)}</div>
          <div style="margin-top:6px;color:#f8fafc;font:700 24px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join("");

  const html = `
    <div style="margin:0;padding:32px 20px;background:#020617;color:#e2e8f0;">
      <div style="max-width:880px;margin:0 auto;padding:28px;border-radius:24px;background:#0b1220;border:1px solid #1e293b;">
        <div style="margin-bottom:24px;">
          <div style="color:#7dd3fc;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-transform:uppercase;letter-spacing:.08em;">AFM257 nightly report</div>
          <h1 style="margin:8px 0 0;color:#f8fafc;font:700 30px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Member media discovery summary</h1>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          ${statCards}
        </div>
        ${buildInsertedVideosHtml(result?.insertedItems)}
      </div>
    </div>
  `;

  const textLines = [
    "AFM257 nightly member media discovery report",
    "",
    ...stats.map(([label, value]) => `${label}: ${value}`),
    "",
    "New videos inserted:",
    ...(Array.isArray(result?.insertedItems) && result.insertedItems.length
      ? result.insertedItems.map((item) => `- ${item.title || item.slug}: ${buildGalleryUrl(item.slug)}`)
      : ["- None"]),
  ];

  return {
    subject: buildEmailSubject(result),
    html,
    text: textLines.join("\n"),
  };
}

async function sendNightlyReportEmail(result) {
  const recipient = getReportRecipient();
  const email = buildReportEmail(result);
  await sendResendEmail({
    to: recipient,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export default async function nightlyMemberMediaDiscovery() {
  try {
    const result = await runMemberMediaDiscovery({
      scheduleLabel: "nightly",
      memberLimit:
        Math.max(1, Number.parseInt(process.env.MEMBER_MEDIA_DISCOVERY_MEMBER_LIMIT || "100", 10) || 100),
    });
    await sendNightlyReportEmail(result);
    return json(result);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await closeDb();
  }
}
