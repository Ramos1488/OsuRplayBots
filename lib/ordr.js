const API = 'https://apis.issou.best/ordr';
export async function submit(buf) {
  const f = new FormData();
  f.append('replayFile', new Blob([buf]), 'replay.osr');
  f.append('username', process.env.ORDR_USERNAME || 'ReplayBot');
  f.append('resolution', process.env.ORDR_RESOLUTION || '1280x720');
  f.append('skin', process.env.ORDR_SKIN || 'default');
  if (process.env.ORDR_KEY) f.append('verificationKey', process.env.ORDR_KEY);
  const r = await fetch(`${API}/renders`, { method: 'POST', body: f });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.renderID) throw new Error(j.message || `o!rdr error ${r.status}`);
  return j.renderID;
}
export async function status(id) {
  const r = await fetch(`${API}/renders?renderID=${id}`, { cache: 'no-store' });
  const x = (await r.json()).renders?.[0];
  const u = x?.videoUrl || x?.videoURL; // o!rdr returns the string "None" until the video exists
  return x ? { progress: x.progress || '', url: /^https?:\/\//.test(u || '') ? u : undefined } : null;
}

// A link can appear before the file is fully uploaded; only treat the render as done once it is a real, non-trivial video.
export async function ready(url) {
  try {
    const r = await fetch(url);
    r.body?.cancel();
    const type = r.headers.get('content-type') || '';
    const len = Number(r.headers.get('content-length') || Infinity);
    return r.ok && !/text\/html/.test(type) && len > 100000;
  } catch {
    return false;
  }
}
