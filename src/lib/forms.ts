"use server";

import { z } from "zod";
import { createContactSubmission, createIntakeSubmission } from "@/db/queries";

const consentMessage = "Please confirm consent before submitting.";

const antiSpamSchema = z.object({
  website: z.string().max(0).optional(),
  startedAt: z.coerce.number().refine((value) => Date.now() - value > 2500, "Please take a moment before submitting.")
});

export const intakeSchema = z
  .object({
    name: z.string().min(2, "Please enter your name.").max(120),
    email: z.string().email("Please enter a valid email address.").max(180),
    phone: z.string().max(40).optional(),
    preferredContact: z.string().min(2, "Choose a preferred contact method."),
    topic: z.string().min(2, "Choose a topic."),
    reason: z.string().min(5, "Please share a short reason for reaching out.").max(240),
    message: z.string().min(10, "Please include a message.").max(2000),
    consent: z.literal("on", { message: consentMessage })
  })
  .merge(antiSpamSchema);

export const contactSchema = z
  .object({
    name: z.string().min(2, "Please enter your name.").max(120),
    email: z.string().email("Please enter a valid email address.").max(180),
    message: z.string().min(10, "Please include a message.").max(1600),
    consent: z.literal("on", { message: consentMessage })
  })
  .merge(antiSpamSchema);

export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function submitIntake(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = intakeSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createIntakeSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      preferredContact: parsed.data.preferredContact,
      topic: parsed.data.topic,
      reason: parsed.data.reason,
      message: parsed.data.message,
      consent: true
    });

    return {
      ok: true,
      message: "Thank you. Your note has been received, and Gabriel will review it with care."
    };
  } catch {
    return {
      ok: false,
      message: "The form could not be saved right now. Please try again later."
    };
  }
}

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createContactSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      consent: true
    });

    return {
      ok: true,
      message: "Thank you. Your message has been received."
    };
  } catch {
    return {
      ok: false,
      message: "The message could not be saved right now. Please try again later."
    };
  }
}
