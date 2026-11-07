import { db } from './db';
import * as ordr from './ordr';
import { tell } from './notify';

const fail = async (job, msg) => {
  await db.from('renders').update({ status: 'failed', error: msg, updated_at: new Date() }).eq('id', job.id);
  await tell(job, `Render failed: ${msg}`);
};

export async function run(job, getBuf) {
  try {
    const id = await ordr.submit(await getBuf());
    await db.from('renders').update({ order_id: id, status: 'rendering', updated_at: new Date() }).eq('id', job.id);
  } catch (e) {
    await fail(job, e.message);
  }
}

export async function poll() {
  const { data = [] } = await db.from('renders').select('*').eq('status', 'rendering').order('id').limit(20);
  await Promise.all(data.map(async (job) => {
    const s = await ordr.status(job.order_id).catch(() => null);
    if (s?.url) {
      const { data: u } = await db.from('renders').update({ status: 'done', video_url: s.url, progress: 'Done', updated_at: new Date() })
        .eq('id', job.id).eq('status', 'rendering').select();
      if (u?.length) await tell(job, 'Your render is ready.', s.url);
    } else if (/fail|error/i.test(s?.progress || '') || Date.now() - new Date(job.created_at) > 45 * 60e3) {
      await fail(job, s?.progress || 'timed out');
    } else if (s) {
      await db.from('renders').update({ progress: s.progress, updated_at: new Date() }).eq('id', job.id);
    }
  }));
  return data.length;
}
