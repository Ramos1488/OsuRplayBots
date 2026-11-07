import nacl from 'tweetnacl';
import { waitUntil } from '@vercel/functions';
import { createJob, submitJob } from '@/lib/jobs';
export const maxDuration = 30;

const reply = (content) => Response.json({ type: 4, data: { content, flags: 64 } }); // 64 = only the user sees it

function validSignature(req, body) {
  try {
    return nacl.sign.detached.verify(
      Buffer.from((req.headers.get('x-signature-timestamp') || '') + body),
      Buffer.from(req.headers.get('x-signature-ed25519') || '', 'hex'),
      Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex'),
    );
  } catch {
    return false;
  }
}

export async function POST(req) {
  const body = await req.text();
  if (!validSignature(req, body)) return new Response('bad signature', { status: 401 });

  const i = JSON.parse(body);
  if (i.type === 1) return Response.json({ type: 1 }); // ping from Discord
  if (i.type !== 2 || i.data.name !== 'render') return reply('Unknown command.');

  const file = i.data.resolved?.attachments?.[i.data.options?.[0]?.value];
  if (!file?.filename?.toLowerCase().endsWith('.osr')) return reply('Attach an .osr replay file.');

  const job = await createJob('discord', { token: i.token, requester: (i.member?.user || i.user)?.username });
  waitUntil(submitJob(job, async () => Buffer.from(await (await fetch(file.url)).arrayBuffer())));
  return Response.json({ type: 5 }); // "thinking..." until the render is ready
}
