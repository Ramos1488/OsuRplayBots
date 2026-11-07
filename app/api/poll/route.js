import { safeEq } from '@/lib/auth';
import { poll } from '@/lib/jobs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!process.env.CRON_SECRET || !safeEq(key, process.env.CRON_SECRET)) return new Response('no', { status: 401 });
  return Response.json({ jobs: await poll() });
}
