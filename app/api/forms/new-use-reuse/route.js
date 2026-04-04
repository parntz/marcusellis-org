import { NextResponse } from "next/server";
import { getDefaultInboxRecipients, sendResendEmail } from "../../../../lib/resend-mail.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stringValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function formatDate(formData, key) {
  const month = stringValue(formData, `submitted[${key}][month]`);
  const day = stringValue(formData, `submitted[${key}][day]`);
  const year = stringValue(formData, `submitted[${key}][year]`);

  if (!month && !day && !year) return "";
  return [month, day, year].filter(Boolean).join("/");
}

function buildRedirect(request, params) {
  const url = new URL("/new-use-reuse", request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const formData = await request.formData();

  if (stringValue(formData, "url")) {
    return buildRedirect(request, { submitted: "1" });
  }

  const songName = stringValue(formData, "submitted[name]");
  const artist = stringValue(formData, "submitted[artist]");
  const label = stringValue(formData, "submitted[label]");
  const recordingDate = formatDate(formData, "date_of_recording");
  const sessionInfo = stringValue(formData, "submitted[session_leader_and_other_musicians_if_known_]");
  const broadcastDate = formatDate(formData, "broadcast_date");
  const seenDate = formatDate(formData, "date_seen_if_different_from_original_broadcast_date");
  const reporterName = stringValue(formData, "submitted[your_name]");
  const reporterEmail = stringValue(formData, "submitted[e_mail_address]");
  const reporterPhone = stringValue(formData, "submitted[phone_number]");
  const additionalInfo = stringValue(formData, "submitted[any_additional_information]");

  const typeOfNewUse = [
    ["movie_soundtrack", "Movie Soundtrack"],
    ["tv_show", "TV Show"],
    ["ad_jingle", "Ad/Jingle"],
    ["use_of_backing_track_in_award_show_etc", "Use of backing track in Award Show, etc"],
  ]
    .filter(([value]) => formData.get(`submitted[type_of_new_use][${value}]`))
    .map(([, labelText]) => labelText);

  if (!reporterName || !reporterEmail || !broadcastDate || !seenDate) {
    return buildRedirect(request, { error: "missing-required" });
  }

  const subject = `New use / reuse submission from ${reporterName}`;
  const rows = [
    ["Name of Song", songName || "Not provided"],
    ["Artist", artist || "Not provided"],
    ["Label", label || "Not provided"],
    ["Date of Recording", recordingDate || "Not provided"],
    ["Session Leader / Other Musicians", sessionInfo || "Not provided"],
    ["Broadcast Date", broadcastDate],
    ["Date Seen", seenDate],
    ["Type of New Use", typeOfNewUse.length ? typeOfNewUse.join(", ") : "Not provided"],
    ["Reporter Name", reporterName],
    ["Reporter Email", reporterEmail],
    ["Reporter Phone", reporterPhone || "Not provided"],
    ["Additional Information", additionalInfo || "Not provided"],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `
    <h1>New Use / Reuse Submission</h1>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
      <tbody>
        ${rows
          .map(
            ([label, value]) =>
              `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  try {
    await sendResendEmail({
      to: getDefaultInboxRecipients(),
      subject,
      text,
      html,
      replyTo: reporterEmail,
    });
  } catch (error) {
    console.error("New use/reuse email failed", error);
    return buildRedirect(request, { error: "send-failed" });
  }

  return buildRedirect(request, { submitted: "1" });
}
