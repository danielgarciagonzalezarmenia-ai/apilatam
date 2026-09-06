// AppForge API - Cloudflare Worker
// Endpoints: /api/health, /api/token, /api/notify, /api/build, /api/build-status, /api/ai
// Secrets: FIREBASE_SA (cuenta de servicio JSON), GEMINI_API_KEY, GH_PAT, BUILD_TOKEN
// Vars: API_KEY (opcional, fallback a la key publica), BASE_URL, GH_REPO, PROJECT_ID

const DEFAULT_API_KEY = 'AIzaSyA4lFjAcn7ebAZF9SkVfpm1RPYnThN8roA';
const DEFAULT_PROJECT = 'appforge-20549';
const DEFAULT_BASE = 'https://danielgarciagonzalezarmenia-ai.github.io/apilatam';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health') return json({ ok: true, hasSA: !!env.FIREBASE_SA, hasGemini: !!env.GEMINI_API_KEY });
      if (request.method === 'POST') {
        if (url.pathname === '/api/token') return await tokenEndpoint(request, env);
        if (url.pathname === '/api/notify') return await notifyEndpoint(request, env);
        if (url.pathname === '/api/build') return await buildEndpoint(request, env);
        if (url.pathname === '/api/build-status') return await buildStatusEndpoint(request, env);
        if (url.pathname === '/api/ai') return await aiEndpoint(request, env);
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }
};

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const pemToBuf = (pem) => {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
};

let tokenCache = { token: null, exp: 0 };
async function getAccessToken(env) {
  if (tokenCache.token && Date.now() / 1000 < tokenCache.exp - 60) return tokenCache.token;
  const sa = JSON.parse(env.FIREBASE_SA);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.readonly https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const data = `${enc(header)}.${enc(claim)}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToBuf(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(data)));
  const jwt = data + '.' + b64u(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
  });
  const t = await r.json();
  if (!t.access_token) throw new Error('SA token: ' + JSON.stringify(t));
  tokenCache = { token: t.access_token, exp: now + 3600 };
  return t.access_token;
}

const pid = (env) => env.PROJECT_ID || DEFAULT_PROJECT;
const fsBase = (env) => `https://firestore.googleapis.com/v1/projects/${pid(env)}/databases/(default)/documents`;

async function fsGet(env, path) {
  const tok = await getAccessToken(env);
  const r = await fetch(`${fsBase(env)}/${path}`, { headers: { Authorization: 'Bearer ' + tok } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('fsGet ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return fromFields(d.fields);
}
async function fsSet(env, path, fields) {
  const tok = await getAccessToken(env);
  const r = await fetch(`${fsBase(env)}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(fields) })
  });
  if (!r.ok) throw new Error('fsSet ' + r.status + ': ' + (await r.text()).slice(0, 200));
}
async function fsList(env, path, orderBy) {
  const tok = await getAccessToken(env);
  const q = { structuredQuery: { from: [{ collectionId: path.split('/').pop() }] } };
  if (orderBy) q.structuredQuery.orderBy = [{ field: { fieldPath: orderBy }, direction: 'DESCENDING' }];
  const r = await fetch(`${fsBase(env)}/${path}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify(q)
  });
  if (!r.ok) throw new Error('fsList ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return (d.document || []).filter(x => x.document).map(x => fromFields(x.document.fields));
}

function toFields(o) {
  const f = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') f[k] = { stringValue: v };
    else if (typeof v === 'number') f[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') f[k] = { booleanValue: v };
    else f[k] = { nullValue: null };
  }
  return f;
}
function fromFields(fields) {
  const o = {};
  if (!fields) return o;
  for (const k of Object.keys(fields)) {
    const v = fields[k];
    if (v.stringValue !== undefined) o[k] = v.stringValue;
    else if (v.integerValue !== undefined) o[k] = Number(v.integerValue);
    else if (v.booleanValue !== undefined) o[k] = v.booleanValue;
  }
  return o;
}

async function verifyUser(env, idToken) {
  const apiKey = env.API_KEY || DEFAULT_API_KEY;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!r.ok) throw new Error('token invalido');
  const d = await r.json();
  return d.users && d.users[0] ? d.users[0].localId : null;
}

const headers = (req) => { const h = {}; req.headers.forEach((v, k) => h[k] = v); return h; };
const body = async (req) => { try { return await req.json(); } catch { return {}; } };

async function tokenEndpoint(request, env) {
  if (!env.FIREBASE_SA) return json({ error: 'no configurado' }, 503);
  const b = await body(request);
  const appId = (b.appId || '').trim();
  const token = (b.token || '').trim();
  if (!appId || !token) return json({ error: 'appId y token requeridos' }, 400);
  const app = await fsGet(env, `apps/${appId}`);
  if (!app) return json({ error: 'app no existe' }, 404);
  if (app.ownerId) {
    const owner = await fsGet(env, `users/${app.ownerId}`);
    if (owner && owner.plan !== 'pro') return json({ error: 'solo apps Pro' }, 403);
  }
  const key = token.replace(/[:\/]/g, '_').slice(0, 120);
  await fsSet(env, `apps/${appId}/devices/${key}`, { token, platform: 'android', ts: String(Date.now()) });
  return json({ ok: true });
}

async function notifyEndpoint(request, env) {
  if (!env.FIREBASE_SA) return json({ error: 'no configurado' }, 503);
  const auth = headers(request).authorization || '';
  const idToken = auth.replace('Bearer ', '');
  const uid = await verifyUser(env, idToken);
  if (!uid) return json({ error: 'sesion invalida' }, 401);
  const me = await fsGet(env, `users/${uid}`);
  if (!me || me.plan !== 'pro') return json({ error: 'solo Pro' }, 403);
  const b = await body(request);
  const appId = (b.appId || '').trim();
  const title = (b.title || '').trim().slice(0, 60);
  const bodyText = (b.body || '').trim().slice(0, 240);
  const app = await fsGet(env, `apps/${appId}`);
  if (!app || app.ownerId !== uid) return json({ error: 'no autorizado' }, 403);
  if (!title) return json({ error: 'titulo requerido' }, 400);
  const devices = await fsList(env, `apps/${appId}/devices`);
  if (!devices.length) return json({ error: 'sin dispositivos registrados', sent: 0 }, 200);
  const base = env.BASE_URL || DEFAULT_BASE;
  const url = `${base}/view.html?id=${appId}`;
  const sent = await fcmSendAll(env, devices.map(d => d.token), title, bodyText, url);
  await fsSet(env, `apps/${appId}/notifications/${Date.now()}`, { title, body: bodyText, sent, ts: String(Date.now()) });
  return json({ ok: true, sent });
}

async function fcmSendAll(env, tokens, title, bodyText, url) {
  const tok = await getAccessToken(env);
  let sent = 0;
  for (const token of tokens.slice(0, 2000)) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${pid(env)}/messages:send`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body: bodyText },
          data: { title, body: bodyText, url, appId: '' },
          android: { priority: 'HIGH' }
        }
      })
    });
    if (r.ok) sent++;
  }
  return sent;
}

async function buildEndpoint(request, env) {
  if (!env.FIREBASE_SA) return json({ error: 'no configurado' }, 503);
  const auth = headers(request).authorization || '';
  const idToken = auth.replace('Bearer ', '');
  const uid = await verifyUser(env, idToken);
  if (!uid) return json({ error: 'sesion invalida' }, 401);
  const me = await fsGet(env, `users/${uid}`);
  if (!me || me.plan !== 'pro') return json({ error: 'solo Pro' }, 403);
  const b = await body(request);
  const appId = (b.appId || '').trim();
  const app = await fsGet(env, `apps/${appId}`);
  if (!app || app.ownerId !== uid) return json({ error: 'no autorizado' }, 403);
  if (!env.GH_REPO || !env.GH_PAT) return json({ error: 'pipeline no configurado' }, 503);
  const base = env.BASE_URL || DEFAULT_BASE;
  await fsSet(env, `apps/${appId}/build/latest`, { status: 'queued', ts: String(Date.now()) });
  const r = await fetch(`https://api.github.com/repos/${env.GH_REPO}/dispatches`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.GH_PAT, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({
      event_type: 'build-app',
      client_payload: {
        appId,
        name: app.name || appId,
        iconUrl: app.logoUrl || '',
        webUrl: `${base}/view.html?id=${appId}`
      }
    })
  });
  if (!r.ok) return json({ error: 'dispatch fallo: ' + r.status }, 502);
  return json({ ok: true, status: 'queued' });
}

async function buildStatusEndpoint(request, env) {
  const auth = headers(request).authorization || '';
  if (auth !== 'Bearer ' + (env.BUILD_TOKEN || '')) return json({ error: 'no autorizado' }, 401);
  const b = await body(request);
  const appId = (b.appId || '').trim();
  if (!appId) return json({ error: 'appId requerido' }, 400);
  await fsSet(env, `apps/${appId}/build/latest`, {
    status: b.status === 'ready' ? 'ready' : 'failed',
    apkUrl: (b.apkUrl || '').slice(0, 400),
    ts: String(Date.now())
  });
  return json({ ok: true });
}

async function aiEndpoint(request, env) {
  if (!env.FIREBASE_SA) return json({ error: 'no configurado' }, 503);
  const auth = headers(request).authorization || '';
  const idToken = auth.replace('Bearer ', '');
  const uid = await verifyUser(env, idToken);
  if (!uid) return json({ error: 'sesion invalida' }, 401);
  const me = await fsGet(env, `users/${uid}`);
  if (!me || me.plan !== 'pro') return json({ error: 'solo Pro' }, 403);
  if (!env.GEMINI_API_KEY) return json({ error: 'IA no configurada' }, 503);
  const b = await body(request);
  const system = [
    'Eres el asistente IA de AppForge. Ayudas a crear apps moviles con bloques.',
    'Respondes en espanol. Cuando el usuario quiera construir o editar su app,',
    'respondes SOLO con JSON valido: {"message":"texto para el usuario","actions":{"name":"","theme":{"font":"Poppins","bg":"#0b0b0e","text":"#f5f5f7","accent":"#6c5ce7","radius":18,"dark":true},"blocks":[{"type":"header","text":"","subtitle":""}]}}',
    'Bloques disponibles: header, heading, text, image, button, list, grid, social, whatsapp, table, faq, carousel, counters, countdown, map, gallery, form, video, youtube, divider, spinner n, footer.',
    'URLs de imagenes: usa https://picsum.photos/seed/xx/800/600. Plantillas sugeridas: negocio, restaurante, gym, peluqueria, doctor, inmobiliaria.'
  ].join('\n');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: (b.prompt || '').slice(0, 4000) }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { temperature: 0.7 }
    })
  });
  if (!r.ok) return json({ error: 'gemini ' + r.status + ': ' + (await r.text()).slice(0, 200) }, 502);
  const d = await r.json();
  const text = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts || []).map(p => p.text || '').join('');
  let recipe = null;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) recipe = JSON.parse(m[0]);
  } catch {}
  return json({ text, recipe });
}