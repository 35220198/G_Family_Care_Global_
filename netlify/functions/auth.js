const crypto = require("crypto");

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

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createJWT(payload, secret) {
  const header = base64url(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const body = base64url(JSON.stringify(payload));

  const data = `${header}.${body}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${data}.${signature}`;
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [header, body, signature] = parts;

    const data = `${header}.${body}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";
    const params = event.queryStringParameters || {};
    const action = params.action;

    const adminEmail = (process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const jwtSecret = process.env.JWT_SECRET || "";

    if (!adminEmail || !adminPassword || !jwtSecret) {
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
        return json(400, {
          error: "Invalid request.",
        });
      }

      const email = String(data.email || "")
        .trim()
        .toLowerCase();

      const password = String(data.password || "");

      if (email !== adminEmail || password !== adminPassword) {
        return json(401, {
          error: "Invalid email or password.",
        });
      }

      const now = Math.floor(Date.now() / 1000);

      const token = createJWT(
        {
          sub: "administrator",
          email: adminEmail,
          iat: now,
          exp: now + 86400,
        },
        jwtSecret
      );

      return json(
        200,
        {
          ok: true,
          email: adminEmail,
        },
        {
          "Set-Cookie":
            `gfamilycare_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
        }
      );
    }

    // CURRENT SESSION
    if (action === "me" && method === "GET") {
      const cookies = parseCookies(
        event.headers.cookie || ""
      );

      const token = cookies.gfamilycare_session;

      if (!token) {
        return json(401, {
          error: "Not authenticated.",
        });
      }

      const session = verifyJWT(token, jwtSecret);

      if (!session || session.email !== adminEmail) {
        return json(401, {
          error: "Not authenticated.",
        });
      }

      return json(200, {
        ok: true,
        email: session.email,
      });
    }

    // LOGOUT
    if (action === "logout" && method === "POST") {
      return json(
        200,
        {
          ok: true,
        },
        {
          "Set-Cookie":
            "gfamilycare_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        }
      );
    }

    // PASSWORD RESET
    if (action === "forgot" && method === "POST") {
      return json(501, {
        error:
          "Password reset is temporarily unavailable. Please contact the administrator.",
      });
    }

    if (action === "reset" && method === "POST") {
      return json(501, {
        error:
          "Password reset is temporarily unavailable. Please contact the administrator.",
      });
    }

    return json(404, {
      error: "Unknown authentication action.",
    });
  } catch (error) {
    console.error(
      "Authentication function error:",
      error
    );

    return json(500, {
      error: "Server error.",
    });
  }
};
