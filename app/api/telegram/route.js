import { waitUntil } from '@vercel/functions';
import { createJob, submitJob } from '@/lib/jobs';
import { tg } from '@/lib/notify';
export const maxDuration = 30;

const ok = () => new Response('ok');

async function downloadReplay(fileId) {
  const file = await tg('getFile', { file_id: fileId });
  if (!file.ok) throw new Error('Could not download the file from Telegram (20 MB max).');
  const res = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.result.file_path}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== process.env.TELEGRAM_SECRET) return new Response('no', { status: 401 });
  const msg = (await req.json()).message;
  if (!msg) return ok();

  const doc = msg.document;
  if (!doc?.file_name?.toLowerCase().endsWith('.osr')) {
    waitUntil(tg('sendMessage', { chat_id: msg.chat.id, text: 'Send me an .osr replay file and I will render it.' }));
    return ok();
  }

  const job = await createJob('telegram', {
    chatId: msg.chat.id, replyTo: msg.message_id, requester: msg.from?.username || msg.from?.id,
  });
  waitUntil((async () => {
    await tg('sendMessage', { chat_id: msg.chat.id, text: 'Replay received, rendering. This takes a few minutes.', reply_to_message_id: msg.message_id });
    await submitJob(job, () => downloadReplay(doc.file_id));
  })());
  return ok();
}
