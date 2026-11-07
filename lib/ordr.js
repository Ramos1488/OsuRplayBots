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
  return x ? { progress: x.progress || '', url: x.videoUrl || x.videoURL } : null;
}
