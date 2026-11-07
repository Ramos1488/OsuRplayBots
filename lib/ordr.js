// o!rdr client: submit a replay, check a render. Nothing else lives here.
const API = 'https://apis.issou.best/ordr';

export async function submit(replay) {
  const form = new FormData();
  form.append('replayFile', new Blob([replay]), 'replay.osr');
  form.append('username', process.env.ORDR_USERNAME || 'ReplayBot');
  form.append('resolution', process.env.ORDR_RESOLUTION || '1280x720');
  form.append('skin', process.env.ORDR_SKIN || 'default');
  if (process.env.ORDR_KEY) form.append('verificationKey', process.env.ORDR_KEY);

  const res = await fetch(`${API}/renders`, { method: 'POST', body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.renderID) throw new Error(json.message || `o!rdr error ${res.status}`);
  return json.renderID;
}

// -> { state: 'pending' | 'done' | 'failed', progress, url? }
export async function check(renderId) {
  const res = await fetch(`${API}/renders?renderID=${renderId}`, { cache: 'no-store' });
  const render = (await res.json()).renders?.[0];
  if (!render) return { state: 'pending', progress: 'Waiting for o!rdr' };

  const progress = render.progress || '';
  const url = render.videoUrl || render.videoURL; // o!rdr sends the string "None" until the video exists
  if (/^https?:\/\//.test(url || '')) return { state: 'done', progress: 'Done', url };
  if (/fail|error/i.test(progress)) return { state: 'failed', progress };
  return { state: 'pending', progress };
}
