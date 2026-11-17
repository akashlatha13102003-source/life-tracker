// Life Tracker × WHOOP helper — a free Cloudflare Worker.
//
// Why it exists: WHOOP's sign-in needs a "client secret" that must never be put inside a web app.
// This small helper keeps the secret, signs members in to WHOOP, keeps their WHOOP login fresh,
// and hands their recent recovery / sleep / strain to the app. It stores nothing else.
//
// Settings it needs (Cloudflare → Workers → this worker → Settings → Variables and Secrets):
//   WHOOP_CLIENT_ID      (text)    from developer.whoop.com
//   WHOOP_CLIENT_SECRET  (secret)  from developer.whoop.com — paste it ONLY here, never in chat or code
//   FIREBASE_PROJECT     (text)    life-tracker-d3948
//   APP_URL              (text)    https://akashlatha13102003-source.github.io/life-tracker/
// and a KV namespace bound as WHOOP_KV (Settings → Bindings → KV namespace).

const WHOOP = 'https://api.prod.whoop.com';
const SCOPES = 'offline read:recovery read:sleep read:cycles read:workout read:body_measurement';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const PREVIEW_ORIGINS = ['http://localhost:8765'];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const allowed = [new URL(env.APP_URL).origin, ...PREVIEW_ORIGINS];
    const cors = allowed.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' }
      : {};
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    // WHOOP sends the member back here after they approve.
    if (req.method === 'GET' && url.pathname === '/callback') return callback(url, env);
    if (req.method === 'GET' && url.pathname === '/') return new Response('Life Tracker WHOOP helper is running.', { headers: { 'Content-Type': 'text/plain' } });
    if (req.method !== 'POST') return json({ error: 'Not found' }, 404);

    let uid;
    try { uid = await verifyFirebase(req, env); } catch { return json({ error: 'Please sign in to Life Tracker again.' }, 401); }

    try {
      if (url.pathname === '/start') {
        // WHOOP needs an 8-character "state"; it links the WHOOP approval back to this member.
        const state = randomState();
        await env.WHOOP_KV.put(`state:${state}`, uid, { expirationTtl: 600 });
        const auth = new URL(`${WHOOP}/oauth/oauth2/auth`);
        auth.search = new URLSearchParams({
          response_type: 'code', client_id: env.WHOOP_CLIENT_ID, redirect_uri: redirectUri(url),
          scope: SCOPES, state,
        }).toString();
        return json({ url: auth.toString() });
      }
      if (url.pathname === '/status') return json({ connected: Boolean(await env.WHOOP_KV.get(`tok:${uid}`)) });
      if (url.pathname === '/sync') {
        const access = await accessToken(uid, env);
        if (!access) return json({ connected: false });
        return json({ connected: true, ...(await recentDays(access)) });
      }
      if (url.pathname === '/disconnect') {
        const access = await accessToken(uid, env).catch(() => null);
        if (access) await fetch(`${WHOOP}/developer/v2/user/access`, { method: 'DELETE', headers: { Authorization: `Bearer ${access}` } }).catch(() => {});
        await env.WHOOP_KV.delete(`tok:${uid}`);
        return json({ connected: false });
      }
      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: String(err?.message || err) }, 502);
    }
  },
};

const redirectUri = (url) => `${url.origin}/callback`;

function randomState() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => abc[b % abc.length]).join('');
}

async function callback(url, env) {
  const back = (result) => Response.redirect(`${env.APP_URL}?whoop=${result}#today`, 302);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code');
  const uid = state ? await env.WHOOP_KV.get(`state:${state}`) : null;
  if (state) await env.WHOOP_KV.delete(`state:${state}`);
  if (!uid || !code) return back(url.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'error');
  try {
    const tok = await tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: redirectUri(url) });
    await saveTokens(uid, tok, env);
    return back('connected');
  } catch {
    return back('error');
  }
}

async function tokenRequest(env, params) {
  const res = await fetch(`${WHOOP}/oauth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: env.WHOOP_CLIENT_ID, client_secret: env.WHOOP_CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`WHOOP sign-in failed (${res.status})`);
  return res.json();
}

const saveTokens = (uid, tok, env) => env.WHOOP_KV.put(`tok:${uid}`, JSON.stringify({
  access: tok.access_token, refresh: tok.refresh_token, exp: Date.now() + (Number(tok.expires_in) || 3600) * 1000,
}));

// A fresh access token. WHOOP replaces the refresh token every time it's used, so the new one is saved straight away.
async function accessToken(uid, env) {
  const saved = JSON.parse((await env.WHOOP_KV.get(`tok:${uid}`)) || 'null');
  if (!saved) return null;
  if (saved.exp - Date.now() > 120000) return saved.access;
  if (!saved.refresh) return null;
  let tok;
  try {
    tok = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: saved.refresh, scope: 'offline' });
  } catch {
    // The WHOOP login was revoked or expired: the member needs to connect again.
    await env.WHOOP_KV.delete(`tok:${uid}`);
    return null;
  }
  await saveTokens(uid, { ...tok, refresh_token: tok.refresh_token || saved.refresh }, env);
  return tok.access_token;
}

async function whoopGet(access, path) {
  const res = await fetch(`${WHOOP}/developer${path}`, { headers: { Authorization: `Bearer ${access}` } });
  if (res.status === 429) throw new Error('WHOOP is busy, try again in a minute');
  if (!res.ok) throw new Error(`WHOOP ${path} failed (${res.status})`);
  return res.json();
}

// The last ~10 days, one row per WHOOP day (a WHOOP "cycle" starts when you wake up).
async function recentDays(access) {
  const q = '?limit=10';
  const [cycles, recoveries, sleeps, workouts] = await Promise.all([
    whoopGet(access, `/v2/cycle${q}`), whoopGet(access, `/v2/recovery${q}`),
    whoopGet(access, `/v2/activity/sleep${q}`), whoopGet(access, `/v2/activity/workout${q}`),
  ]);
  const body = await whoopGet(access, '/v2/user/measurement/body').catch(() => null);
  return {
    days: (cycles.records ?? []).map((c) => toDay(c, recoveries.records ?? [], sleeps.records ?? [], workouts.records ?? [])),
    weightKg: body?.weight_kilogram ?? null,
  };
}

/** Local calendar date (YYYY-MM-DD) of a WHOOP time, using the member's own time zone offset like "+05:30". */
function localDay(iso, offset = '+00:00') {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(offset || '') || ['', '+', '00', '00'];
  const mins = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  return new Date(new Date(iso).getTime() + mins * 60000).toISOString().slice(0, 10);
}

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

function toDay(c, recoveries, sleeps, workouts) {
  const rec = recoveries.find((r) => r.cycle_id === c.id && r.score_state === 'SCORED');
  const sleep = sleeps.find((s) => s.id === rec?.sleep_id)
    ?? sleeps.find((s) => s.cycle_id === c.id && !s.nap && s.score_state === 'SCORED');
  const st = sleep?.score?.stage_summary;
  const asleepMs = st ? (st.total_light_sleep_time_milli || 0) + (st.total_slow_wave_sleep_time_milli || 0) + (st.total_rem_sleep_time_milli || 0) : null;
  const dayWorkouts = workouts.filter((w) => new Date(w.start) >= new Date(c.start) && (!c.end || new Date(w.start) < new Date(c.end)));
  return {
    day: localDay(c.start, c.timezone_offset),
    start: Date.parse(c.start),
    recovery: rec ? Math.round(rec.score.recovery_score) : null,
    hrv: rec ? Math.round(rec.score.hrv_rmssd_milli) : null,
    rhr: rec ? Math.round(rec.score.resting_heart_rate) : null,
    spo2: rec ? r1(rec.score.spo2_percentage) : null,
    skinTemp: rec ? r1(rec.score.skin_temp_celsius) : null,
    calibrating: Boolean(rec?.score?.user_calibrating),
    strain: c.score_state === 'SCORED' ? r1(c.score.strain) : null,
    kcal: c.score_state === 'SCORED' ? Math.round((c.score.kilojoule || 0) / 4.184) : null,
    sleepH: asleepMs !== null ? r1(asleepMs / 3600000) : null,
    sleepPerf: sleep?.score?.sleep_performance_percentage ?? null,
    workouts: dayWorkouts.map((w) => ({ sport: w.sport_name ?? '', start: Date.parse(w.start), end: Date.parse(w.end), strain: r1(w.score?.strain) })),
  };
}

/* ---------- Checks that the request comes from a signed-in Life Tracker member ---------- */

const b64urlBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (ch) => ch.charCodeAt(0));
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
let jwksCache = null;

async function verifyFirebase(req, env) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [h, p, sig] = token.split('.');
  if (!sig) throw new Error('no token');
  const header = b64urlJson(h);
  const claims = b64urlJson(p);
  const now = Date.now() / 1000;
  if (header.alg !== 'RS256') throw new Error('bad alg');
  if (claims.aud !== env.FIREBASE_PROJECT || claims.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT}`) throw new Error('wrong project');
  if (!(claims.exp > now) || claims.iat > now + 300 || !claims.sub) throw new Error('expired');
  if (!jwksCache || jwksCache.until < Date.now()) {
    const res = await fetch(JWKS_URL);
    jwksCache = { keys: (await res.json()).keys ?? [], until: Date.now() + 3600000 };
  }
  const jwk = jwksCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) { jwksCache = null; throw new Error('unknown key'); }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('bad signature');
  return claims.sub;
}
