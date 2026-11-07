import { waitUntil } from '@vercel/functions';
import { sql } from '@/lib/db';
import { run } from '@/lib/jobs';
import { tg } from '@/lib/notify';
export const maxDuration = 30;

export async function POST(req) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== process.env.TELEGRAM_SECRET) return new Response('no', { status: 401 });
  const m = (await req.json()).message;
  if (!m) return new Response('ok');
  const d = m.document;
  if (!d?.file_name?.toLowerCase().endsWith('.osr')) {
    waitUntil(tg('sendMessage', { chat_id: m.chat.id, text: 'Send me an .osr replay file and I will render it.' }));
    return new Response('ok');
  }
  const [job] = await sql`insert into renders (platform, chat_id, reply_to, requester)
    values ('telegram', ${String(m.chat.id)}, ${String(m.message_id)}, ${m.from?.username || String(m.from?.id)}) returning *`;
  waitUntil((async () => {
    await tg('sendMessage', { chat_id: m.chat.id, text: 'Replay received, rendering. This takes a few minutes.', reply_to_message_id: m.message_id });
    await run(job, async () => {
      const f = await tg('getFile', { file_id: d.file_id });
      const r = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${f.result.file_path}`);
      return Buffer.from(await r.arrayBuffer());
    });
  })());
  return new Response('ok');
}
