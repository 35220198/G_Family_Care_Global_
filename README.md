# L&F Medical Clinic — gfamilycare

Static website (HTML / CSS / JavaScript) for **L&F Medical Clinic**, hosted on
**GitHub Pages** with a custom domain bought on **Namecheap**.

There is **no backend**: no Cloudflare Pages Functions, no PHP, no serverless
functions. Everything — including the admin login — runs in the browser.

---

## Structure

```
index.html                 public website
CNAME                      GitHub Pages custom domain (fill in your domain)
robots.txt                 crawler rules (admin + tools excluded)
sitemap.xml                sitemap for search engines
.nojekyll                  tells GitHub Pages to serve files as-is
css/
  admin.css                admin design system (glassmorphism, brand colours)
images/                    ALL site images (logo, favicon, service photos)
js/
  main.js                  public site behaviour
  admin-auth.js            client-side auth: SHA-256 check + session storage
  admin-login.js           login page logic (remember me, show password)
  admin-dashboard.js       dashboard logic + localStorage persistence
admin/
  index.html               administrator login (glassmorphism)
  dashboard.html           full admin dashboard (5 panels)
  reset.html               password reset instructions + in-browser hash tool
```

> The old Cloudflare `functions/` folder, `_headers.txt`, `package.json`
> (wrangler) and the standalone `password-hash.html` have been **removed**.
> The hash generator now lives inside `admin/reset.html` and is excluded from
> search engines via `robots.txt`.

---

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository (e.g. `gfamilycare`).
2. Repository → **Settings → Pages**.
3. **Source:** *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. The site goes live at `https://<username>.github.io/<repo>/`.

### Custom domain (Namecheap)

1. Edit the `CNAME` file in the repository root and replace
   `YOUR-DOMAIN-HERE.com` with your domain, e.g. `www.gfamilycare.com`.
2. In **Namecheap → Domain List → Manage → Advanced DNS**, add:
   - `CNAME` record — Host `www`, Value `<username>.github.io`
   - For the apex/root domain, add GitHub Pages **A records**:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Back in GitHub → **Settings → Pages → Custom domain**, enter the domain and
   tick **Enforce HTTPS** (the certificate is issued automatically).

All asset paths in this project are **relative** (`images/…`, `../css/…`), so the
site works both at a project URL and at the custom domain.

---

## Admin login

- URL: `/admin/` (e.g. `https://www.gfamilycare.com/admin/`)
- Email: `info@gfamilycare.com`
- **Default password: `Gfamily@2026` — change it before going live.**

### Changing the password

The password is stored only as a **SHA-256 hash** in `js/admin-auth.js`
(`passwordHash`). To change it:

1. Open `/admin/reset.html` and use the built-in generator, **or** run:
   `printf '%s' 'YourNewPassword' | sha256sum`
2. Copy the 64-character hash.
3. In `js/admin-auth.js`, replace the value of `passwordHash` and commit.

### Sessions

| Remember me | Lifetime | Storage |
|---|---|---|
| Off | 8 hours | `sessionStorage` (cleared when the tab closes) |
| On  | 30 days | `localStorage` |

Only the email address is remembered on the login form — never the password.

---

## ⚠️ Security note (important)

A static site has **no server**, so the admin gate is a **client-side** check.
It keeps casual visitors out of the admin UI, but it is **not** a real security
boundary:

- Anyone can read `js/admin-auth.js` and see the hash.
- Dashboard data (leads, services, banner) is stored in **each visitor's own
  browser** (`localStorage`) — it is not shared between devices and is not a
  database.

**Do not put patient records, real credentials or anything confidential behind
it.** If you need true multi-user security and shared data, move the admin to a
server-backed app (e.g. a small Node/PHP API with a real database and hashed
passwords) — the public website can stay exactly as it is.

---

## Public contact form

The consultation form on the homepage is unchanged: it builds a pre-filled
WhatsApp message to **+254 720 886-526** and opens it — no third-party form
service, no data stored on the site.

---

## SEO / social

- Canonical URL, `og:*` and `twitter:*` tags point to `https://www.gfamilycare.com/`.
- `og:image` / `twitter:image` use `images/logo-512.png`.
- Favicon: `images/favicon.png`.
- Update the canonical/`og:url` values if your final domain differs.

## Recent Updates
- **Frontend & Branding (`index.html`, `js/main.js`)**: Medical Care image (`images/service-medical-care.jpg`) framed inside a clean `#FFFFFF` container with balanced padding, subtle border/shadow, and `object-fit: cover` zoom-to-fit across service media cards.
- **Full-Access Admin CMS (`admin/dashboard.html`, `css/admin.css`, `js/admin-dashboard.js`, `js/main.js`)**: Modernized high-contrast dashboard UI, live image uploads & previews, full section editors (Top Bar & Identity, Hero & Leadership, Services & Location, 24/7 On-Call, Care Commitments, Blog & Banner, Footer & Social Links, Account & Backup), grey helper text (`#6B7280`) and recommended image dimensions/character limits on inputs.
- **AI Care Assistant (`js/ai-chatbot.js`, `admin/dashboard.html`)**: Supports OpenAI-compatible API configuration in the CMS with automatic injection of clinic services, FAQs, hours, and 24/7 contact info, plus a built-in general health & clinic fallback engine and urgent symptom callout.
