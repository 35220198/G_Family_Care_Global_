const enc = new TextEncoder();

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function unb64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8", ...headers}});
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign","verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
async function makeSession(email, secret, maxAgeSeconds) {
  const payload = b64url(enc.encode(JSON.stringify({email, exp:Date.now()+maxAgeSeconds*1000})));
  const sig = b64url(await hmac(secret, payload));
  return payload + "." + sig;
}
async function readSession(request, secret) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)gfamily_session=([^;]+)/);
  if (!match) return null;
  const [payload, sig] = match[1].split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(secret, payload);
  const supplied = unb64url(sig);
  if (expected.length !== supplied.length) return null;
  let diff=0; for(let i=0;i<expected.length;i++) diff |= expected[i]^supplied[i];
  if(diff!==0) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (!data.email || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}
async function derive(password, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits(
    {name:"PBKDF2", salt, iterations, hash:"SHA-256"}, base, 256
  ));
}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function fromHex(s){return new Uint8Array(s.match(/.{1,2}/g).map(x=>parseInt(x,16)))}
async function verifyPassword(password, stored) {
  const [scheme,it,saltHex,hashHex] = (stored||"").split("$");
  if(scheme!=="pbkdf2" || !it || !saltHex || !hashHex) return false;
  const hash=await derive(password,fromHex(saltHex),Number(it));
  const expected=fromHex(hashHex);
  if(hash.length!==expected.length) return false;
  let diff=0; for(let i=0;i<hash.length;i++) diff |= hash[i]^expected[i];
  return diff===0;
}
function cookie(value,maxAge) {
  return `gfamily_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function onRequest(context) {
  const {request, env} = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "me";

  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":url.origin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  }});

  const secret=env.ADMIN_SESSION_SECRET;
  const adminEmail=(env.ADMIN_EMAIL||"").trim().toLowerCase();
  const passwordHash=env.ADMIN_PASSWORD_HASH;
  const plainPassword=env.ADMIN_PASSWORD;
  if(!secret || !adminEmail || (!passwordHash && !plainPassword)) {
    return json({error:"Admin authentication is not configured in Cloudflare yet."},500);
  }

  if(action==="login" && request.method==="POST"){
    let body={}; try{body=await request.json()}catch{return json({error:"Invalid request."},400)}
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const validPassword = passwordHash
      ? await verifyPassword(password,passwordHash)
      : (password.length > 0 && password === plainPassword);
    if(email!==adminEmail || !validPassword){
      return json({error:"Incorrect email or password."},401);
    }
    const maxAge = body.remember === true ? 30*24*60*60 : 8*60*60;
    const token=await makeSession(adminEmail,secret,maxAge);
    return json({ok:true,remember:body.remember===true},200,{"Set-Cookie":cookie(token,maxAge)});
  }

  if(action==="me"){
    const session=await readSession(request,secret);
    if(!session) return json({error:"Not authenticated."},401);
    return json({authenticated:true,email:session.email});
  }

  if(action==="logout"){
    return json({ok:true},200,{"Set-Cookie":cookie("",0)});
  }

  return json({error:"Unknown action."},404);
}
