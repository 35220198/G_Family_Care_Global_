const enc = new TextEncoder();

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);

  return btoa(s)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unb64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");

  while (s.length % 4) {
    s += "=";
  }

  const bin = atob(s);

  return Uint8Array.from(
    bin,
    c => c.charCodeAt(0)
  );
}

function json(data, status = 200, headers = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",

        ...headers
      }
    }
  );
}

async function hmac(secret, value) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(value)
    )
  );
}

async function makeSession(
  email,
  secret
) {
  const payload =
    b64url(
      enc.encode(
        JSON.stringify({
          email,
          exp:
            Date.now() +
            8 * 60 * 60 * 1000
        })
      )
    );

  const signature =
    b64url(
      await hmac(
        secret,
        payload
      )
    );

  return `${payload}.${signature}`;
}

async function readSession(
  request,
  secret
) {
  if (!secret) return null;

  const cookie =
    request.headers.get("Cookie") || "";

  const match =
    cookie.match(
      /(?:^|;\s*)gfamily_session=([^;]+)/
    );

  if (!match) return null;

  const [
    payload,
    signature
  ] = match[1].split(".");

  if (!payload || !signature) {
    return null;
  }

  try {
    const expected =
      await hmac(
        secret,
        payload
      );

    const supplied =
      unb64url(signature);

    if (
      expected.length !==
      supplied.length
    ) {
      return null;
    }

    let difference = 0;

    for (
      let i = 0;
      i < expected.length;
      i++
    ) {
      difference |=
        expected[i] ^
        supplied[i];
    }

    if (difference !== 0) {
      return null;
    }

    const data =
      JSON.parse(
        new TextDecoder().decode(
          unb64url(payload)
        )
      );

    if (
      !data.email ||
      !data.exp ||
      Date.now() > data.exp
    ) {
      return null;
    }

    return data;

  } catch {
    return null;
  }
}

function sessionCookie(value) {
  return [
    `gfamily_session=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=28800"
  ].join("; ");
}

function clearCookie() {
  return [
    "gfamily_session=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}

function authError(
  message = "Not authenticated."
) {
  return json(
    { error: message },
    401
  );
}


/* =========================
   DATABASE
========================= */

async function ensureDatabase(env) {

  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding DB is not configured."
    );
  }

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      preferred_contact TEXT,
      care_type TEXT NOT NULL,
      preferred_time TEXT,
      location TEXT,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}


/* =========================
   AUTHENTICATION
========================= */

async function handleAuth(
  request,
  env
) {
  const url =
    new URL(request.url);

  const action =
    url.searchParams.get(
      "action"
    ) || "me";

  const adminEmail =
    String(
      env.ADMIN_EMAIL || ""
    )
      .trim()
      .toLowerCase();

  const adminPassword =
    String(
      env.ADMIN_PASSWORD || ""
    );

  const secret =
    String(
      env.ADMIN_SESSION_SECRET || ""
    );

  if (
    !adminEmail ||
    !adminPassword ||
    !secret
  ) {
    return json(
      {
        error:
          "Admin authentication is not configured in Cloudflare."
      },
      500
    );
  }


  if (
    action === "login" &&
    request.method === "POST"
  ) {

    let body;

    try {
      body =
        await request.json();

    } catch {
      return json(
        {
          error:
            "Invalid request."
        },
        400
      );
    }

    const email =
      String(
        body?.email || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body?.password || ""
      );

    if (
      email !== adminEmail ||
      password !== adminPassword
    ) {
      return json(
        {
          error:
            "Incorrect email or password."
        },
        401
      );
    }

    const session =
      await makeSession(
        adminEmail,
        secret
      );

    return json(
      {
        ok: true,
        email: adminEmail
      },
      200,
      {
        "Set-Cookie":
          sessionCookie(
            session
          )
      }
    );
  }


  if (
    action === "me" &&
    request.method === "GET"
  ) {

    const session =
      await readSession(
        request,
        secret
      );

    if (!session) {
      return authError();
    }

    return json({
      authenticated: true,
      email: session.email
    });
  }


  if (
    action === "logout" &&
    (
      request.method === "POST" ||
      request.method === "GET"
    )
  ) {

    return json(
      { ok: true },
      200,
      {
        "Set-Cookie":
          clearCookie()
      }
    );
  }

  return json(
    {
      error:
        "Unknown authentication action."
    },
    404
  );
}


/* =========================
   PUBLIC ENQUIRY
========================= */

async function createEnquiry(
  request,
  env
) {

  let body;

  try {

    body =
      await request.json();

  } catch {

    return json(
      {
        error:
          "Invalid request."
      },
      400
    );
  }

  const fullName =
    String(
      body?.full_name || ""
    ).trim();

  const phone =
    String(
      body?.phone || ""
    ).trim();

  const email =
    String(
      body?.email || ""
    ).trim();

  const preferredContact =
    String(
      body?.preferred_contact ||
      "WhatsApp"
    ).trim();

  const careType =
    String(
      body?.care_type || ""
    ).trim();

  const preferredTime =
    String(
      body?.preferred_time || ""
    ).trim();

  const location =
    String(
      body?.location || ""
    ).trim();

  const details =
    String(
      body?.details || ""
    ).trim();


  if (
    !fullName ||
    !phone ||
    !careType
  ) {

    return json(
      {
        error:
          "Name, phone number and care type are required."
      },
      400
    );
  }


  if (fullName.length > 150) {

    return json(
      {
        error:
          "Name is too long."
      },
      400
    );
  }


  if (phone.length > 50) {

    return json(
      {
        error:
          "Phone number is too long."
      },
      400
    );
  }


  if (email.length > 200) {

    return json(
      {
        error:
          "Email is too long."
      },
      400
    );
  }


  if (details.length > 1200) {

    return json(
      {
        error:
          "Care notes are too long."
      },
      400
    );
  }


  await ensureDatabase(env);


  const result =
    await env.DB
      .prepare(`
        INSERT INTO enquiries
        (
          full_name,
          phone,
          email,
          preferred_contact,
          care_type,
          preferred_time,
          location,
          details
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        fullName,
        phone,
        email || null,
        preferredContact,
        careType,
        preferredTime,
        location,
        details
      )
      .run();


  return json(
    {
      ok: true,
      id:
        result.meta.last_row_id
    },
    201
  );
}


/* =========================
   AUTH CHECK
========================= */

async function requireAdmin(
  request,
  env
) {

  const secret =
    env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return null;
  }

  return readSession(
    request,
    secret
  );
}


/* =========================
   GET ENQUIRIES
========================= */

async function getEnquiries(
  request,
  env
) {

  const session =
    await requireAdmin(
      request,
      env
    );

  if (!session) {
    return authError();
  }

  await ensureDatabase(env);

  const url =
    new URL(request.url);

  const status =
    url.searchParams.get(
      "status"
    );


  let query = `
    SELECT
      id,
      full_name,
      phone,
      email,
      preferred_contact,
      care_type,
      preferred_time,
      location,
      details,
      status,
      created_at
    FROM enquiries
  `;

  const params = [];


  if (
    status &&
    [
      "new",
      "contacted",
      "completed"
    ].includes(status)
  ) {

    query +=
      " WHERE status = ?";

    params.push(status);
  }


  query +=
    " ORDER BY datetime(created_at) DESC";


  const result =
    await env.DB
      .prepare(query)
      .bind(...params)
      .all();


  return json({
    enquiries:
      result.results || []
  });
}


/* =========================
   UPDATE ENQUIRY
========================= */

async function updateEnquiry(
  request,
  env,
  id
) {

  const session =
    await requireAdmin(
      request,
      env
    );

  if (!session) {
    return authError();
  }

  await ensureDatabase(env);


  let body;

  try {

    body =
      await request.json();

  } catch {

    return json(
      {
        error:
          "Invalid request."
      },
      400
    );
  }


  const status =
    String(
      body?.status || ""
    );


  if (
    ![
      "new",
      "contacted",
      "completed"
    ].includes(status)
  ) {

    return json(
      {
        error:
          "Invalid status."
      },
      400
    );
  }


  await env.DB
    .prepare(
      "UPDATE enquiries SET status = ? WHERE id = ?"
    )
    .bind(
      status,
      id
    )
    .run();


  return json({
    ok: true
  });
}


/* =========================
   DELETE ENQUIRY
========================= */

async function deleteEnquiry(
  request,
  env,
  id
) {

  const session =
    await requireAdmin(
      request,
      env
    );

  if (!session) {
    return authError();
  }

  await ensureDatabase(env);


  await env.DB
    .prepare(
      "DELETE FROM enquiries WHERE id = ?"
    )
    .bind(id)
    .run();


  return json({
    ok: true
  });
}


/* =========================
   DASHBOARD STATISTICS
========================= */

async function getStats(
  request,
  env
) {

  const session =
    await requireAdmin(
      request,
      env
    );

  if (!session) {
    return authError();
  }

  await ensureDatabase(env);


  const result =
    await env.DB
      .prepare(`
        SELECT
          COUNT(*) AS total,

          SUM(
            CASE
              WHEN status = 'new'
              THEN 1
              ELSE 0
            END
          ) AS new_count,

          SUM(
            CASE
              WHEN status = 'contacted'
              THEN 1
              ELSE 0
            END
          ) AS contacted_count,

          SUM(
            CASE
              WHEN status = 'completed'
              THEN 1
              ELSE 0
            END
          ) AS completed_count

        FROM enquiries
      `)
      .first();


  return json({
    total:
      Number(
        result?.total || 0
      ),

    new:
      Number(
        result?.new_count || 0
      ),

    contacted:
      Number(
        result?.contacted_count || 0
      ),

    completed:
      Number(
        result?.completed_count || 0
      )
  });
}


/* =========================
   WORKER
========================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

    try {

      if (
        url.pathname ===
        "/api/auth"
      ) {

        return handleAuth(
          request,
          env
        );
      }


      if (
        url.pathname ===
          "/api/enquiries" &&
        request.method === "POST"
      ) {

        return createEnquiry(
          request,
          env
        );
      }


      if (
        url.pathname ===
          "/api/enquiries" &&
        request.method === "GET"
      ) {

        return getEnquiries(
          request,
          env
        );
      }


      if (
        url.pathname ===
          "/api/stats" &&
        request.method === "GET"
      ) {

        return getStats(
          request,
          env
        );
      }


      const enquiryMatch =
        url.pathname.match(
          /^\/api\/enquiries\/(\d+)$/
        );


      if (enquiryMatch) {

        const id =
          enquiryMatch[1];


        if (
          request.method ===
          "PATCH"
        ) {

          return updateEnquiry(
            request,
            env,
            id
          );
        }


        if (
          request.method ===
          "DELETE"
        ) {

          return deleteEnquiry(
            request,
            env,
            id
          );
        }
      }


      return env.ASSETS.fetch(
        request
      );

    } catch (error) {

      console.error(error);

      return json(
        {
          error:
            "Server error. Please try again later."
        },
        500
      );
    }
  }
};
