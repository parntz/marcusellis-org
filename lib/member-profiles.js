import fs from "fs";
import path from "path";
import { getClient } from "./sqlite.mjs";
import { resolveMemberMediaHref } from "./legacy-site-url.js";

function cleanText(value, max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanUrl(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanLongText(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeParagraphHtml(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|aside|header|footer|blockquote|pre|li|ul|ol|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");

  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n");
}

function normalizeMediaType(value) {
  return String(value || "").trim().toLowerCase() === "video" ? "video" : "image";
}

function normalizeCheckbox(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => typeof item === "string")
          .map((item) => cleanText(item, 200))
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function normalizeStringArrayInput(value, maxItemLength = 200) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(/\r?\n|,/)
        .map((item) => item.trim());
  return Array.from(
    new Set(
      items
        .map((item) => cleanText(item, maxItemLength))
        .filter(Boolean)
    )
  );
}

function parseJsonLinks(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          const url = cleanUrl(item);
          return url ? { label: url, url } : null;
        }
        if (!item || typeof item !== "object") return null;
        const url = cleanUrl(item.url || "");
        if (!url) return null;
        return {
          label: cleanText(item.label || item.url || "", 200),
          url: resolveMemberMediaHref(url, { allowYouTube: true }),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeLinkItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const url = cleanUrl(item.url || "");
      if (!url) return null;
      return {
        label: cleanText(item.label || item.url || "", 200),
        url: resolveMemberMediaHref(url, { allowYouTube: true }),
      };
    })
    .filter(Boolean);
}

function normalizeLinkInput(value) {
  if (Array.isArray(value)) return normalizeLinkItems(value);
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      const url = cleanUrl((parts[1] || parts[0] || "").trim());
      if (!url) return null;
      return {
        label: cleanText((parts[1] ? parts[0] : parts[0]) || url, 200),
        url: resolveMemberMediaHref(url, { allowYouTube: true }),
      };
    })
    .filter(Boolean);
}

function parseJsonMediaLinks(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const url = cleanUrl(item.url || "");
        if (!url) return null;
        return {
          label: cleanText(item.label || item.url || "", 200),
          url: resolveMemberMediaHref(url, { allowYouTube: true }),
          mimeType: cleanText(item.mimeType || "", 120),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeMediaLinksInput(value) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split("|");
          const url = cleanUrl((parts[1] || parts[0] || "").trim());
          if (!url) return null;
          return {
            label: cleanText((parts[1] ? parts[0] : parts[0]) || url, 200),
            url: resolveMemberMediaHref(url, { allowYouTube: true }),
            mimeType: "",
          };
        });

  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const url = cleanUrl(item.url || "");
      if (!url) return null;
      return {
        label: cleanText(item.label || item.url || "", 200),
        url: resolveMemberMediaHref(url, { allowYouTube: true }),
        mimeType: cleanText(item.mimeType || "", 120),
      };
    })
    .filter(Boolean);
}

function normalizeFlag(value) {
  return Number(value) === 1;
}

function mapMediaRow(row) {
  return {
    id: Number(row.id),
    memberPageId: Number(row.memberPageId),
    mediaType: normalizeMediaType(row.mediaType),
    label: String(row.label || ""),
    assetUrl: String(row.assetUrl || ""),
    mimeType: String(row.mimeType || ""),
    displayOrder: Number(row.displayOrder || 0),
  };
}

function isLocalMemberUpload(url = "") {
  return String(url || "").startsWith("/uploads/member-profiles/");
}

function memberProfileUploadsDir() {
  return path.join(process.cwd(), "public", "uploads", "member-profiles");
}

function extractLocalMemberUploadId(url = "") {
  const prefix = "/uploads/member-profiles/";
  const raw = String(url || "").trim();
  if (!raw.startsWith(prefix)) {
    return "";
  }
  const encoded = raw.slice(prefix.length).split(/[?#]/, 1)[0] || "";
  if (!encoded) {
    return "";
  }
  let id = "";
  try {
    id = decodeURIComponent(encoded);
  } catch {
    id = encoded;
  }
  if (!id || id.includes("/") || id.includes("\\")) {
    return "";
  }
  return id;
}

function localUploadPathFromUrl(url = "") {
  const id = extractLocalMemberUploadId(url);
  return id ? path.join(memberProfileUploadsDir(), id) : "";
}

function normalizeMediaItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      mediaType: normalizeMediaType(item?.mediaType),
      label: cleanText(item?.label || "", 160),
      assetUrl: resolveMemberMediaHref(cleanUrl(item?.assetUrl || ""), {
        allowYouTube: normalizeMediaType(item?.mediaType) === "video",
      }),
      mimeType: cleanText(item?.mimeType || "", 120),
      displayOrder: index + 1,
    }))
    .filter((item) => item.assetUrl);
}

function mapMemberRow(row, media = []) {
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    firstName: String(row.firstName || ""),
    lastName: String(row.lastName || ""),
    canonicalUrl: String(row.canonicalUrl || ""),
    pictureUrl: resolveMemberMediaHref(String(row.pictureUrl || "")),
    featuredVideoUrl: resolveMemberMediaHref(String(row.featuredVideoUrl || ""), { allowYouTube: true }),
    featuredVideoTitle: String(row.featuredVideoTitle || ""),
    legacyVideoLinks: parseJsonLinks(row.legacyVideoLinksJson),
    audioLinks: parseJsonMediaLinks(row.audioLinksJson),
    webLinks: parseJsonLinks(row.webLinksJson),
    musicalStyles: parseJsonArray(row.musicalStylesJson),
    primaryInstruments: parseJsonArray(row.primaryInstrumentsJson),
    additionalInstrumentsText: String(row.additionalInstrumentsText || ""),
    workDesired: parseJsonArray(row.workDesiredJson),
    workDesiredOther: String(row.workDesiredOther || ""),
    numberChartRead: normalizeFlag(row.numberChartRead),
    numberChartWrite: normalizeFlag(row.numberChartWrite),
    chordChartRead: normalizeFlag(row.chordChartRead),
    chordChartWrite: normalizeFlag(row.chordChartWrite),
    hasHomeStudio: normalizeFlag(row.hasHomeStudio),
    isEngineer: normalizeFlag(row.isEngineer),
    additionalSkills: parseJsonArray(row.additionalSkillsJson),
    additionalSkillsOther: String(row.additionalSkillsOther || ""),
    websiteUrl: String(row.websiteUrl || ""),
    facebookUrl: String(row.facebookUrl || ""),
    reverbnationUrl: String(row.reverbnationUrl || ""),
    xUrl: String(row.xUrl || ""),
    contactHtml: String(row.contactHtml || ""),
    descriptionHtml: String(row.descriptionHtml || ""),
    personnelHtml: String(row.personnelHtml || ""),
    bodyHtml: String(row.bodyHtml || ""),
    media,
  };
}

export async function listMemberProfileMedia(memberPageId) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        member_page_id AS memberPageId,
        media_type AS mediaType,
        label,
        asset_url AS assetUrl,
        mime_type AS mimeType,
        display_order AS displayOrder
      FROM member_profile_media
      WHERE member_page_id = ?
      ORDER BY display_order ASC, id ASC
    `,
    args: [memberPageId],
  });
  return rs.rows.map(mapMediaRow);
}

export async function getMemberProfileBySlug(slug) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        first_name AS firstName,
        last_name AS lastName,
        canonical_url AS canonicalUrl,
        picture_url AS pictureUrl,
        featured_video_url AS featuredVideoUrl,
        featured_video_title AS featuredVideoTitle,
        legacy_video_links_json AS legacyVideoLinksJson,
        audio_links_json AS audioLinksJson,
        web_links_json AS webLinksJson,
        musical_styles_json AS musicalStylesJson,
        primary_instruments_json AS primaryInstrumentsJson,
        additional_instruments_text AS additionalInstrumentsText,
        work_desired_json AS workDesiredJson,
        work_desired_other AS workDesiredOther,
        number_chart_read AS numberChartRead,
        number_chart_write AS numberChartWrite,
        chord_chart_read AS chordChartRead,
        chord_chart_write AS chordChartWrite,
        has_home_studio AS hasHomeStudio,
        is_engineer AS isEngineer,
        additional_skills_json AS additionalSkillsJson,
        additional_skills_other AS additionalSkillsOther,
        website_url AS websiteUrl,
        facebook_url AS facebookUrl,
        reverbnation_url AS reverbnationUrl,
        x_url AS xUrl,
        contact_html AS contactHtml,
        description_html AS descriptionHtml,
        personnel_html AS personnelHtml,
        body_html AS bodyHtml
      FROM member_pages
      WHERE slug = ?
      LIMIT 1
    `,
    args: [String(slug || "").trim()],
  });

  const row = rs.rows?.[0];
  if (!row) return null;
  const media = await listMemberProfileMedia(row.id);
  return mapMemberRow(row, media);
}

export async function getMemberProfileById(id) {
  const client = getClient();
  const memberId = Number(id);
  if (!Number.isFinite(memberId) || memberId <= 0) {
    return null;
  }

  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        first_name AS firstName,
        last_name AS lastName,
        canonical_url AS canonicalUrl,
        picture_url AS pictureUrl,
        featured_video_url AS featuredVideoUrl,
        featured_video_title AS featuredVideoTitle,
        legacy_video_links_json AS legacyVideoLinksJson,
        audio_links_json AS audioLinksJson,
        web_links_json AS webLinksJson,
        musical_styles_json AS musicalStylesJson,
        primary_instruments_json AS primaryInstrumentsJson,
        additional_instruments_text AS additionalInstrumentsText,
        work_desired_json AS workDesiredJson,
        work_desired_other AS workDesiredOther,
        number_chart_read AS numberChartRead,
        number_chart_write AS numberChartWrite,
        chord_chart_read AS chordChartRead,
        chord_chart_write AS chordChartWrite,
        has_home_studio AS hasHomeStudio,
        is_engineer AS isEngineer,
        additional_skills_json AS additionalSkillsJson,
        additional_skills_other AS additionalSkillsOther,
        website_url AS websiteUrl,
        facebook_url AS facebookUrl,
        reverbnation_url AS reverbnationUrl,
        x_url AS xUrl,
        contact_html AS contactHtml,
        description_html AS descriptionHtml,
        personnel_html AS personnelHtml,
        body_html AS bodyHtml
      FROM member_pages
      WHERE id = ?
      LIMIT 1
    `,
    args: [memberId],
  });

  const row = rs.rows?.[0];
  if (!row) return null;
  const media = await listMemberProfileMedia(row.id);
  return mapMemberRow(row, media);
}

export function normalizeMemberProfileInput(input = {}) {
  return {
    firstName: cleanText(input?.firstName || "", 120),
    lastName: cleanText(input?.lastName || "", 120),
    title: cleanText(input?.title || "", 180),
    canonicalUrl: cleanUrl(input?.canonicalUrl || ""),
    pictureUrl: resolveMemberMediaHref(cleanUrl(input?.pictureUrl || "")),
    featuredVideoUrl: resolveMemberMediaHref(cleanUrl(input?.featuredVideoUrl || ""), { allowYouTube: true }),
    featuredVideoTitle: cleanText(input?.featuredVideoTitle || "", 180),
    legacyVideoLinks: normalizeLinkInput(input?.legacyVideoLinks || []),
    audioLinks: normalizeMediaLinksInput(input?.audioLinks || []),
    webLinks: normalizeLinkInput(input?.webLinks || []),
    musicalStyles: normalizeStringArrayInput(input?.musicalStyles || []),
    primaryInstruments: normalizeStringArrayInput(input?.primaryInstruments || []),
    additionalInstrumentsText: cleanLongText(input?.additionalInstrumentsText || "", 1000),
    workDesired: normalizeStringArrayInput(input?.workDesired || []),
    workDesiredOther: cleanLongText(input?.workDesiredOther || "", 1000),
    numberChartRead: normalizeCheckbox(input?.numberChartRead),
    numberChartWrite: normalizeCheckbox(input?.numberChartWrite),
    chordChartRead: normalizeCheckbox(input?.chordChartRead),
    chordChartWrite: normalizeCheckbox(input?.chordChartWrite),
    hasHomeStudio: normalizeCheckbox(input?.hasHomeStudio),
    isEngineer: normalizeCheckbox(input?.isEngineer),
    additionalSkills: normalizeStringArrayInput(input?.additionalSkills || []),
    additionalSkillsOther: cleanLongText(input?.additionalSkillsOther || "", 1000),
    websiteUrl: cleanUrl(input?.websiteUrl || ""),
    facebookUrl: cleanUrl(input?.facebookUrl || ""),
    reverbnationUrl: cleanUrl(input?.reverbnationUrl || ""),
    xUrl: cleanUrl(input?.xUrl || ""),
    contactHtml: normalizeParagraphHtml(input?.contactHtml || ""),
    descriptionHtml: normalizeParagraphHtml(input?.descriptionHtml || ""),
    personnelHtml: normalizeParagraphHtml(input?.personnelHtml || ""),
    bodyHtml: normalizeParagraphHtml(input?.bodyHtml || ""),
    media: normalizeMediaItems(input?.media || []),
  };
}

export async function updateMemberProfile(memberPageId, input = {}) {
  const client = getClient();
  const normalized = normalizeMemberProfileInput(input);

  if (!normalized.title) {
    throw new Error("Title is required.");
  }

  const existing = await getMemberProfileById(memberPageId);
  if (!existing) {
    throw new Error("Member profile not found.");
  }

  await client.execute({
    sql: `
      UPDATE member_pages
      SET
        first_name = ?,
        last_name = ?,
        title = ?,
        canonical_url = ?,
        picture_url = ?,
        featured_video_url = ?,
        featured_video_title = ?,
        legacy_video_links_json = ?,
        audio_links_json = ?,
        web_links_json = ?,
        musical_styles_json = ?,
        primary_instruments_json = ?,
        additional_instruments_text = ?,
        work_desired_json = ?,
        work_desired_other = ?,
        number_chart_read = ?,
        number_chart_write = ?,
        chord_chart_read = ?,
        chord_chart_write = ?,
        has_home_studio = ?,
        is_engineer = ?,
        additional_skills_json = ?,
        additional_skills_other = ?,
        website_url = ?,
        facebook_url = ?,
        reverbnation_url = ?,
        x_url = ?,
        contact_html = ?,
        description_html = ?,
        personnel_html = ?,
        body_html = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      normalized.firstName,
      normalized.lastName,
      normalized.title,
      normalized.canonicalUrl,
      normalized.pictureUrl,
      normalized.featuredVideoUrl,
      normalized.featuredVideoTitle,
      JSON.stringify(normalized.legacyVideoLinks),
      JSON.stringify(normalized.audioLinks),
      JSON.stringify(normalized.webLinks),
      JSON.stringify(normalized.musicalStyles),
      JSON.stringify(normalized.primaryInstruments),
      normalized.additionalInstrumentsText,
      JSON.stringify(normalized.workDesired),
      normalized.workDesiredOther,
      normalized.numberChartRead ? 1 : 0,
      normalized.numberChartWrite ? 1 : 0,
      normalized.chordChartRead ? 1 : 0,
      normalized.chordChartWrite ? 1 : 0,
      normalized.hasHomeStudio ? 1 : 0,
      normalized.isEngineer ? 1 : 0,
      JSON.stringify(normalized.additionalSkills),
      normalized.additionalSkillsOther,
      normalized.websiteUrl,
      normalized.facebookUrl,
      normalized.reverbnationUrl,
      normalized.xUrl,
      normalized.contactHtml,
      normalized.descriptionHtml,
      normalized.personnelHtml,
      normalized.bodyHtml,
      memberPageId,
    ],
  });

  await client.execute({
    sql: `DELETE FROM member_profile_media WHERE member_page_id = ?`,
    args: [memberPageId],
  });

  if (normalized.media.length) {
    await client.batch(
      normalized.media.map((item) => ({
        sql: `
          INSERT INTO member_profile_media (
            member_page_id,
            media_type,
            label,
            asset_url,
            mime_type,
            display_order,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [memberPageId, item.mediaType, item.label, item.assetUrl, item.mimeType, item.displayOrder],
      })),
      "write"
    );
  }

  return getMemberProfileById(memberPageId);
}

export async function deleteMemberProfile(memberPageId) {
  const client = getClient();
  const existing = await getMemberProfileById(memberPageId);
  if (!existing) {
    throw new Error("Member profile not found.");
  }

  const localUploadPaths = existing.media
    .map((item) => String(item?.assetUrl || ""))
    .filter(isLocalMemberUpload)
    .map(localUploadPathFromUrl);

  const blobAssetIds = existing.media
    .map((item) => String(item?.assetUrl || ""))
    .filter((url) => url.startsWith("/api/member-profiles/asset/"))
    .map((url) => {
      const parts = url.split("/api/member-profiles/asset/");
      return parts[1] ? decodeURIComponent(parts[1]) : "";
    })
    .filter(Boolean);

  await client.execute({
    sql: `DELETE FROM auth_users WHERE member_page_id = ?`,
    args: [memberPageId],
  });

  await client.execute({
    sql: `DELETE FROM member_pages WHERE id = ?`,
    args: [memberPageId],
  });

  for (const filePath of localUploadPaths) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Keep deletion resilient even if an upload file is already gone.
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN && blobAssetIds.length) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("member-profile-media");
      await Promise.all(blobAssetIds.map((id) => store.delete(id)));
    } catch {
      // The DB delete is authoritative; blob cleanup is best-effort.
    }
  }

  return true;
}
