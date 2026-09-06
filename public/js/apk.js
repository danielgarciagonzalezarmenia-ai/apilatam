export const APK_WORKER_URL = 'https://apilatam.mundofutbolcol.workers.dev';

export async function apkApi(path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(APK_WORKER_URL + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {})
  });
  let data = {};
  try { data = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(data && data.error ? data.error : 'Error ' + r.status);
  return data;
}