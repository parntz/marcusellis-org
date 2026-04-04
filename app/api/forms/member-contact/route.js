import { NextResponse } from "next/server";
import { resolveMemberContactTarget } from "../../../../lib/member-contact-target.js";
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

function safeReturnPath(value, fallback) {
  const candidate = String(value || "").trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  return candidate;
}

function buildRedirect(request, returnTo, params = {}) {
  const url = new URL(returnTo, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const formData = await request.formData();
  const memberSlug = stringValue(formData, "memberSlug");
  const returnTo = safeReturnPath(
    stringValue(formData, "returnTo"),
    memberSlug ? `/user/${memberSlug}/contact` : "/member-pages"
  );

  if (stringValue(formData, "url")) {
    return buildRedirect(request, returnTo, { submitted: "1" });
  }

  const senderName = stringValue(formData, "name");
  const senderEmail = stringValue(formData, "mail");
  const messageSubject = stringValue(formData, "subject");
  const messageBody = stringValue(formData, "message");

  if (!memberSlug || !senderName || !senderEmail || !messageSubject || !messageBody) {
    return buildRedirect(request, returnTo, { error: "missing-required" });
  }

  const target = await resolveMemberContactTarget(memberSlug);
  if (!target) {
    return buildRedirect(request, returnTo, { error: "unknown-member" });
  }

  const subject = `[Member Contact] ${messageSubject}`;

  const lines = [
    `Member: ${target.title}`,
    `Member Slug: ${target.memberSlug}`,
    `Public Member Email On File: ${target.email ? "Yes" : "No"}`,
    `Sender Name: ${senderName}`,
    `Sender Email: ${senderEmail}`,
    `Subject: ${messageSubject}`,
    "",
    messageBody,
  ];

  const html = `
    <h1>Member Contact Message</h1>
    <p><strong>Member:</strong> ${escapeHtml(target.title)}</p>
    <p><strong>Member Slug:</strong> ${escapeHtml(target.memberSlug)}</p>
    <p><strong>Public Member Email On File:</strong> ${target.email ? "Yes" : "No"}</p>
    <p><strong>Sender Name:</strong> ${escapeHtml(senderName)}</p>
    <p><strong>Sender Email:</strong> ${escapeHtml(senderEmail)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(messageSubject)}</p>
    <hr />
    <p>${escapeHtml(messageBody).replace(/\n/g, "<br />")}</p>
  `;

  try {
    await sendResendEmail({
      to: getDefaultInboxRecipients(),
      subject,
      text: lines.join("\n"),
      html,
      replyTo: senderEmail,
    });
  } catch (error) {
    console.error("Member contact email failed", error);
    return buildRedirect(request, returnTo, { error: "send-failed" });
  }

  return buildRedirect(request, returnTo, { submitted: "1" });
}
