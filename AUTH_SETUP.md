# Auth Setup (Credentials + Google + reCAPTCHA)

This project now includes:

- Username/email + password sign-in
- Strong password enforcement on registration
- Google sign-in
- reCAPTCHA verification on credential sign-in and registration

## Required environment variables

Create a `.env.local` file in project root:

```bash
AUTH_SECRET=replace-with-long-random-secret
AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

Optional local override:

```bash
RECAPTCHA_BYPASS=true
```

If your local Google OAuth client is not ready yet, set:

```bash
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

That disables the Google provider and removes the Google sign-in button locally.

## Routes added

- `/sign-in`
- `/register`
- `/account` (requires login)

## Database table

`scripts/db-init.mjs` now creates:

- `auth_users` with `username`, `email`, `password_hash`, and `google_sub`.

## Notes

- The site no longer uses static export mode.
- Netlify config now uses the Next.js plugin for server-backed auth.
