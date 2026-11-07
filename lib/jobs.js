import { sql } from './db';
import * as ordr from './ordr';
import { tell } from './notify';

const fail = async (job, msg) => {
  await sql`update renders set status = 'failed', error = ${msg}, updated_at = now() where id = ${job.id}`;
  await tell(job, `Render failed: ${msg}`);
};

export async function run(job, getBuf) {
  try {
    const id = await ordr.submit(await getBuf());
    await sql`update renders set order_id = ${id}, status = 'rendering', updated_at = now() where id = ${job.id}`;
  } catch (e) {
    await fail(job, e.message);
  }
}

export async function poll() {
  const data = await sql`select * from renders where status = 'rendering' order by id limit 20`;
  return Promise.all(data.map(async (job) => {
    const s = await ordr.status(job.order_id).catch((e) => ({ progress: `status error: ${e.message}` }));
    const out = { id: job.id, order: job.order_id, progress: s?.progress ?? 'not found', video: !!s?.url };
    try {
      if (s?.url && await ordr.ready(s.url)) {
        const u = await sql`update renders set status = 'done', video_url = ${s.url}, progress = 'Done', updated_at = now()
          where id = ${job.id} and status = 'rendering' returning id`;
        if (u.length) await tell(job, 'Your render is ready.', s.url);
      } else if (/fail|error/i.test(s?.progress || '') || Date.now() - new Date(job.created_at) > 45 * 60e3) {
        await fail(job, s?.progress || 'timed out');
      } else if (s) {
        await sql`update renders set progress = ${s.progress}, updated_at = now() where id = ${job.id}`;
      }
    } catch (e) {
      out.sendError = e.message;
      await sql`update renders set error = ${'send: ' + e.message} where id = ${job.id}`;
    }
    return out;
  }));
}
