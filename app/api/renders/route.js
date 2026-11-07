import { isAdmin } from '@/lib/auth';
import { getData } from '@/lib/data';
import { poll } from '@/lib/jobs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by the open admin panel every few seconds: also checks o!rdr, so progress and delivery stay live.
export async function GET() {
  if (!isAdmin()) return new Response('no', { status: 401 });
  await poll().catch(() => {});
  return Response.json(await getData());
}
