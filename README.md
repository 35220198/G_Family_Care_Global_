# L&F Medical Clinic

Static site (HTML/CSS/JS) with a Cloudflare Pages Function handling administrator
authentication. Cloudflare only — no Netlify.

## Structure
    index.html              public website
    css/style.css           public styles
    css/admin.css           admin design system (animated green gradient)
    js/main.js              public site behaviour
    js/admin-sparkle.js     star burst effect
    js/admin-login.js       login + remember me
    js/admin-dashboard.js   session check + logout
    admin/index.html        administrator login
    admin/dashboard.html    protected dashboard
    admin/reset.html        password change instructions
    functions/api/auth.js   Cloudflare Pages Function (login / me / logout)
    tools/password-hash.html  PBKDF2 hash generator

## Deploy (Cloudflare Pages, Git integration)
Direct Upload / drag-and-drop does NOT compile the functions/ folder, so the
login would never work that way. Connect the GitHub repository instead.

    Framework preset        None
    Build command           (leave empty)
    Build output directory  /
    Production branch       main

## Required variables
Settings -> Variables and secrets -> Production:

    ADMIN_EMAIL             the administrator email address
    ADMIN_SESSION_SECRET    long random string, 40+ characters
    ADMIN_PASSWORD          the administrator password
      (or ADMIN_PASSWORD_HASH from tools/password-hash.html, which takes priority)

Add variables, then Deployments -> Retry deployment.

## Sessions
    Remember me off   8 hours
    Remember me on    30 days
The cookie is HttpOnly, Secure, SameSite=Lax and signed with HMAC-SHA256.
Only the email address is stored in the browser, never the password.
