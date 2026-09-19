const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const store = getStore("gfamilycare-auth");

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function parseCookies(header = "") {
  const cookies = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) {
      cookies[part.slice(0, i).trim()] = decodeURIComponent(
        part.slice(i + 1).trim()
      );
    }
  });
  return cookies;
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function sendResetEmail(email, token) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Email service is not configured.");
  }

  const siteUrl =
    process.env.URL || "https://g-family-care-global.netlify.app";

  const resetUrl =
    `${siteUrl}/admin/reset.html?token=${encodeURIComponent(token)}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.EMAIL_FROM ||
        "G.Family Care <onboarding@resend.dev>",
      to: [email],
      subject: "G.Family Care administrator password reset",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>G.Family Care Administrator</h2>
          <p>A password reset was requested for your administrator account.</p>
          <p>
            <a href="${resetUrl}"
               style="background:#047857;color:white;padding:12px 18px;
                      text-decoration:none;border-radius:8px;display:inline-block">
              Reset password
            </a>
          </p>
          <p>This link expires in 30 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend error:", errorText);
    throw new Error("Unable to send reset email.");
  }
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";
    const params = event.queryStringParameters || {};
    const action = params.action;

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      return json(500, {
        error: "Administrator authentication is not configured.",
      });
    }

    // LOGIN
    if (action === "login" && method === "POST") {
      let data = {};

      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Invalid request." });
      }

      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");

      if (email !== adminEmail || password !== adminPassword) {
        return json(401, { error: "Invalid email or password." });
      }

      const sessionToken = randomToken();

      await store.set(
        `session:${hash(sessionToken)}`,
        JSON.stringify({
          email: adminEmail,
          createdAt: Date.now(),
        })
      );

      return json(
        200,
        {
          ok: true,
          email: adminEmail,
        },
        {
          "Set-Cookie":
            `gfamilycare_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
        }
      );
    }

    // CURRENT SESSION
    if (action === "me" && method === "GET") {
      const cookies = parseCookies(event.headers.cookie || "");
      const sessionToken = cookies.gfamilycare_session;

      if (!sessionToken) {
        return json(401, { error: "Not authenticated." });
      }

      const session = await store.get(
        `session:${hash(sessionToken)}`,
        { type: "json" }
      );

      if (!session) {
        return json(401, { error: "Not authenticated." });
      }

      if (Date.now() - session.createdAt > 86400000) {
        await store.delete(`session:${hash(sessionToken)}`);
        return json(401, { error: "Session expired." });
      }

      return json(200, {
        ok: true,
        email: session.email,
      });
    }

    // LOGOUT
    if (action === "logout" && method === "POST") {
      const cookies = parseCookies(event.headers.cookie || "");
      const sessionToken = cookies.gfamilycare_session;

      if (sessionToken) {
        await store.delete(`session:${hash(sessionToken)}`);
      }

      return json(
        200,
        { ok: true },
        {
          "Set-Cookie":
            "gfamilycare_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        }
      );
    }

    // REQUEST PASSWORD RESET
    if (action === "forgot" && method === "POST") {
      let data = {};

      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Invalid request." });
      }

      const email = String(data.email || "").trim().toLowerCase();

      // Don't reveal whether an account exists.
      if (email !== adminEmail) {
        return json(200, {
          message:
            "If that email belongs to the administrator account, a reset email has been sent.",
        });
      }

      const token = randomToken();

      await store.set(
        `reset:${hash(token)}`,
        JSON.stringify({
          email: adminEmail,
          createdAt: Date.now(),
        })
      );

      try {
        await sendResetEmail(adminEmail, token);
      } catch (error) {
        console.error(error);
        return json(500, {
          error: "The reset email could not be sent.",
        });
      }

      return json(200, {
        message:
          "If that email belongs to the administrator account, a reset email has been sent.",
      });
    }

    // RESET PASSWORD
    if (action === "reset" && method === "POST") {
      let data = {};

      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Invalid request." });
      }

      const token = String(data.token || "");
      const newPassword = String(data.password || "");

      if (!token || newPassword.length < 12) {
        return json(400, {
          error: "Password must be at least 12 characters.",
        });
      }

      const key = `reset:${hash(token)}`;
      const resetData = await store.get(key, { type: "json" });

      if (!resetData) {
        return json(400, {
          error: "This reset link is invalid or has expired.",
        });
      }

      if (Date.now() - resetData.createdAt > 30 * 60 * 1000) {
        await store.delete(key);

        return json(400, {
          error: "This reset link has expired.",
        });
      }

      if (resetData.email !== adminEmail) {
        return json(400, {
          error: "Invalid reset request.",
        });
      }

      /*
       * Store the new password as a Netlify environment variable
       * through the Netlify API in a later configuration step.
       *
       * For now, return a clear configuration message rather than
       * pretending the password was changed.
       */
      return json(501, {
        error:
          "Password reset storage still needs to be connected in Netlify.",
      });
    }

    return json(404, { error: "Unknown authentication action." });
  } catch (error) {
    console.error("Authentication function error:", error);

    return json(500, {
      error: "Server error.",
    });
  }
};
