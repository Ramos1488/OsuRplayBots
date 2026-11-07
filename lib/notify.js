export const tg = (method, body) =>
  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => r.json());

export const dcEdit = (token, content) =>
  fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }),
  });

export async function tell(job, text, videoUrl) {
  if (job.platform === 'discord') return dcEdit(job.discord_token, videoUrl ? `${text}\n${videoUrl}` : text);
  const base = { chat_id: job.chat_id, reply_to_message_id: Number(job.reply_to) || undefined, allow_sending_without_reply: true };
  if (videoUrl) {
    const r = await tg('sendVideo', { ...base, video: videoUrl, caption: text });
    if (r.ok) return;
    text = `${text}\n${videoUrl}`;
  }
  const r = await tg('sendMessage', { ...base, text });
  if (!r.ok) throw new Error(r.description);
}
