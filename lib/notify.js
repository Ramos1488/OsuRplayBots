// Delivering a result back to the chat where it was requested.
const TG_API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const TG_UPLOAD_LIMIT = 50 * 1024 * 1024;

export const tg = (method, body) =>
  fetch(`${TG_API()}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => r.json());

export async function discordEdit(token, payload) {
  const res = await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Discord ${res.status} (the command link lasts 15 minutes)`);
}

// The o!rdr link can be a direct mp4 or a web page that contains it. Returns a Buffer, or null.
async function fetchVideo(url) {
  let res = await fetch(url);
  if (/text\/html/.test(res.headers.get('content-type') || '')) {
    const mp4 = (await res.text()).match(/https?:\/\/[^"'\s<>\\]+\.mp4[^"'\s<>\\]*/i)?.[0];
    if (!mp4) return null;
    res = await fetch(mp4.replace(/&amp;/g, '&'));
  }
  if (!res.ok || /text\/html/.test(res.headers.get('content-type') || '')) return null;
  if (Number(res.headers.get('content-length') || 0) > TG_UPLOAD_LIMIT) { res.body?.cancel(); return null; }
  const video = Buffer.from(await res.arrayBuffer());
  return video.length > 100_000 && video.length <= TG_UPLOAD_LIMIT ? video : null;
}

async function uploadToTelegram(job, caption, videoUrl) {
  const video = await fetchVideo(videoUrl);
  if (!video) return false;
  const form = new FormData();
  form.append('chat_id', job.chat_id);
  form.append('caption', caption);
  form.append('supports_streaming', 'true');
  form.append('allow_sending_without_reply', 'true');
  if (job.reply_to) form.append('reply_to_message_id', job.reply_to);
  form.append('video', new Blob([video], { type: 'video/mp4' }), 'replay.mp4');
  const out = await (await fetch(`${TG_API()}/sendVideo`, { method: 'POST', body: form })).json();
  return Boolean(out.ok);
}

async function sendTelegram(job, text, videoUrl) {
  const base = { chat_id: job.chat_id, reply_to_message_id: Number(job.reply_to) || undefined, allow_sending_without_reply: true };
  if (videoUrl) {
    if (await uploadToTelegram(job, text, videoUrl).catch(() => false)) return;
    text += `\n${videoUrl}`; // too big or not a plain file: send the link instead
  }
  const out = await tg('sendMessage', { ...base, text });
  if (!out.ok) throw new Error(out.description);
}

const sendDiscord = (job, text, videoUrl) =>
  discordEdit(job.discord_token, { content: videoUrl ? `${text}\n${videoUrl}` : text });

export const deliver = (job, text, videoUrl) =>
  (job.platform === 'discord' ? sendDiscord : sendTelegram)(job, text, videoUrl);
