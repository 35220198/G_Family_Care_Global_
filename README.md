# G.Family Care website + secure admin

The public website remains the supplied single-page HTML. The added `/admin/` area uses Netlify Functions for authentication, Netlify Blobs for the stored password/reset state, and Resend for password-reset email.

## Netlify environment variables
Set these in Netlify → Site configuration → Environment variables:

- `ADMIN_EMAIL` = `info@gfamilycare.com`
- `ADMIN_PASSWORD_HASH` = initial scrypt hash (or let the password be set after deployment by generating one with the helper below)
- `ADMIN_SESSION_SECRET` = a long random secret, at least 32 characters
- `SITE_URL` = your live Netlify URL, e.g. `https://your-site.netlify.app`
- `RESEND_API_KEY` = your Resend API key
- `FROM_EMAIL` = a verified sender, e.g. `G.Family Care <info@gfamilycare.com>`

## Generate an initial password hash
Run:

```bash
node -e "const crypto=require('crypto'); const p=process.argv[1],s=process.env.ADMIN_SESSION_SECRET; crypto.scrypt(p,s,64,(e,k)=>{if(e)throw e; console.log(k.toString('hex'))})" "YOUR-STRONG-PASSWORD"
```

Put the printed value into `ADMIN_PASSWORD_HASH` in Netlify. Do not put the plaintext password in the repository.

After the first login, the forgot-password/reset flow can change the stored password in Netlify Blobs.

## Important
A frontend-only HTML password is not secure because anyone can inspect JavaScript. This project therefore keeps the credential check in a Netlify serverless function and stores the active password hash outside the public files.
