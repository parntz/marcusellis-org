"use client";

import { useActionState } from "react";
import { submitContact, type FormState } from "@/lib/forms";

const initialState: FormState = { ok: false, message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-2 text-sm text-gold-200">{errors[0]}</p> : null;
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);

  return (
    <form action={action} className="grid gap-5 rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-6">
      <input
        type="hidden"
        name="startedAt"
        ref={(node) => {
          if (node && !node.value) {
            node.value = String(Date.now());
          }
        }}
      />
      <input className="hidden" type="text" name="website" tabIndex={-1} autoComplete="off" />
      <label className="grid gap-2 text-sm font-medium">
        Name
        <input name="name" className="focus-ring rounded-2xl border border-ivory/15 bg-charcoal/70 px-4 py-3" autoComplete="name" />
        <FieldError errors={state.errors?.name} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input name="email" type="email" className="focus-ring rounded-2xl border border-ivory/15 bg-charcoal/70 px-4 py-3" autoComplete="email" />
        <FieldError errors={state.errors?.email} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Message
        <textarea name="message" rows={6} className="focus-ring rounded-2xl border border-ivory/15 bg-charcoal/70 px-4 py-3" />
        <FieldError errors={state.errors?.message} />
      </label>
      <label className="flex gap-3 text-sm leading-7 text-ivory/72">
        <input type="checkbox" name="consent" className="mt-2 h-4 w-4 rounded border-ivory/30 bg-charcoal" />
        I consent to being contacted about this message and understand this site provides educational information only.
      </label>
      <FieldError errors={state.errors?.consent} />
      {state.message ? <p className={state.ok ? "text-gold-200" : "text-ivory/75"}>{state.message}</p> : null}
      <button disabled={pending} className="focus-ring rounded-full bg-gold-200 px-6 py-3 font-semibold text-forest-950 disabled:opacity-60">
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
