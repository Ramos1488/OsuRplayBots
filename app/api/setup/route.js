import { isAdmin } from '@/lib/auth';
import { tg } from '@/lib/notify';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isAdmin()) return new Response('no', { status: 401 });
  const origin = new URL(req.url).origin;
  const telegram = await tg('setWebhook', { url: `${origin}/api/telegram`, secret_token: process.env.TELEGRAM_SECRET, allowed_updates: ['message'] });
  const r = await fetch(`https://discord.com/api/v10/applications/${process.env.DISCORD_APP_ID}/commands`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    body: JSON.stringify([{ name: 'render', description: 'Render an osu! replay (.osr)', options: [{ type: 11, name: 'replay', description: 'Replay file', required: true }] }]),
  });
  return Response.json({ telegram, discord: r.ok ? 'command registered' : await r.text(),
    note: `Set the Discord Interactions Endpoint URL to ${origin}/api/discord` });
}
