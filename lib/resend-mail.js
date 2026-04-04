import { Resend } from "resend";

let resendClient = null;

function readEnv(name) {
  const value = process.env[name];
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "undefined") {
    return "";
  }

  return trimmed;
}

function splitEmailList(value) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(requireEnv("RESEND_API_KEY"));
  }

  return resendClient;
}

export function getDefaultInboxRecipients() {
  const recipients = splitEmailList(readEnv("RESEND_TO_EMAIL"));
  if (!recipients.length) {
    throw new Error("Missing RESEND_TO_EMAIL.");
  }
  return recipients;
}

export function hasDefaultInboxRecipients() {
  return splitEmailList(readEnv("RESEND_TO_EMAIL")).length > 0;
}

export async function sendResendEmail({ to, subject, html, text, replyTo }) {
  const recipients = Array.isArray(to) ? to : splitEmailList(String(to || ""));
  if (!recipients.length) {
    throw new Error("Missing recipient email.");
  }

  const resend = getResendClient();
  const payload = {
    from: requireEnv("RESEND_FROM_EMAIL"),
    to: recipients,
    subject,
    html,
    text,
  };

  const replyToList = Array.isArray(replyTo)
    ? replyTo.filter(Boolean)
    : splitEmailList(String(replyTo || ""));
  if (replyToList.length) {
    payload.replyTo = replyToList;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(error.message || "Resend request failed.");
  }

  return data;
}
