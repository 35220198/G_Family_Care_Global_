# G.Family Care — Cloudflare Pages version

This cleaned project keeps the supplied website content and separates the front-end into HTML, CSS and JavaScript. The old Netlify authentication calls were replaced with a Cloudflare Pages Function at `/api/auth`.

## Deploy to Cloudflare Pages
- Connect the GitHub repository.
- Production branch: `main`.
- Build command: `exit 0` (or leave blank if the dashboard accepts it).
- Build output directory: `.`
- Root directory: `/`.
- Do not upload `node_modules`.

## Activate admin login — simple method
In Cloudflare Pages go to **Settings → Variables and Secrets** and add:
- `ADMIN_EMAIL` = your administrator email (for example `info@gfamilycare.com`)
- `ADMIN_PASSWORD` = your chosen strong password
- `ADMIN_SESSION_SECRET` = a long random secret, at least 32 characters

Save them for **Production** and redeploy.

The password is stored as a Cloudflare secret, not in the HTML/JS. For stronger credential storage you can instead generate a PBKDF2 hash with `tools/password-hash.html` and use `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`.

Admin login: `/admin/`.

## Important
The old ZIP used Netlify Functions/Blobs. This version removes those Netlify calls and uses a Cloudflare Pages Function. Password-reset email is not enabled yet; the reset page explains the current setup. It can be added later with a Cloudflare-compatible email/token store.
