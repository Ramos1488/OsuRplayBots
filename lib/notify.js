const TG = () => `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;

export const tg = (method, body) =>
  fetch(`${TG()}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => r.json());

export const dcEdit = (token, content) =>
  fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }),
  });

async function uploadVideo(job, text, url) {
  const v = await fetch(url);
  if (!v.ok) return false;
  const buf = Buffer.from(await v.arrayBuffer());
  if (buf.length > 50 * 1024 * 1024) return false; // Telegram bot upload limit
  const f = new FormData();
  f.append('chat_id', job.chat_id);
  f.append('caption', text);
  f.append('supports_streaming', 'true');
  f.append('allow_sending_without_reply', 'true');
  if (job.reply_to) f.append('reply_to_message_id', job.reply_to);
  f.append('video', new Blob([buf], { type: 'video/mp4' }), 'replay.mp4');
  const r = await (await fetch(`${TG()}/sendVideo`, { method: 'POST', body: f })).json();
  return !!r.ok;
}

export async function tell(job, text, videoUrl) {
  if (job.platform === 'discord') return dcEdit(job.discord_token, videoUrl ? `${text}\n${videoUrl}` : text);
  const base = { chat_id: job.chat_id, reply_to_message_id: Number(job.reply_to) || undefined, allow_sending_without_reply: true };
  if (videoUrl) {
    try { if (await uploadVideo(job, text, videoUrl)) return; } catch {}
    const r = await tg('sendVideo', { ...base, video: videoUrl, caption: text });
    if (r.ok) return;
    text = `${text}\n${videoUrl}`;
  }
  const r = await tg('sendMessage', { ...base, text });
  if (!r.ok) throw new Error(r.description);
}
