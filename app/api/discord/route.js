import nacl from 'tweetnacl';
import { waitUntil } from '@vercel/functions';
import { sql } from '@/lib/db';
import { run } from '@/lib/jobs';
export const maxDuration = 30;

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('x-signature-ed25519') || '';
  const ts = req.headers.get('x-signature-timestamp') || '';
  let ok = false;
  try { ok = nacl.sign.detached.verify(Buffer.from(ts + body), Buffer.from(sig, 'hex'), Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')); } catch {}
  if (!ok) return new Response('bad signature', { status: 401 });

  const i = JSON.parse(body);
  if (i.type === 1) return Response.json({ type: 1 });
  if (i.type !== 2 || i.data.name !== 'render') return Response.json({ type: 4, data: { content: 'Unknown command.' } });

  const att = i.data.resolved?.attachments?.[i.data.options?.[0]?.value];
  if (!att?.filename?.toLowerCase().endsWith('.osr')) {
    return Response.json({ type: 4, data: { content: 'Attach an .osr replay file.', flags: 64 } });
  }
  const [job] = await sql`insert into renders (platform, discord_token, requester)
    values ('discord', ${i.token}, ${(i.member?.user || i.user)?.username ?? null}) returning *`;
  waitUntil(run(job, async () => Buffer.from(await (await fetch(att.url)).arrayBuffer())));
  return Response.json({ type: 5 });
}
