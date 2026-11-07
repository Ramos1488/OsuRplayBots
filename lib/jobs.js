// Life of a render: new -> rendering -> done | failed
import { sql } from './db';
import * as ordr from './ordr';
import { deliver } from './notify';

const MAX_RENDER_MS = 45 * 60e3;
const str = (v) => (v == null ? null : String(v));

export async function createJob(platform, { chatId, replyTo, token, requester } = {}) {
  const [job] = await sql`
    insert into renders (platform, chat_id, reply_to, discord_token, requester)
    values (${platform}, ${str(chatId)}, ${str(replyTo)}, ${token ?? null}, ${str(requester)})
    returning *`;
  return job;
}

// Sends a message to the chat; a delivery problem is saved on the job instead of thrown.
async function notify(job, text, videoUrl) {
  try {
    await deliver(job, text, videoUrl);
  } catch (e) {
    await sql`update renders set error = ${`send: ${e.message}`} where id = ${job.id}`;
    return e.message;
  }
}

async function markFailed(job, reason) {
  await sql`update renders set status = 'failed', error = ${reason}, updated_at = now() where id = ${job.id}`;
  await notify(job, `Render failed: ${reason}`);
}

export async function submitJob(job, getReplay) {
  try {
    const orderId = await ordr.submit(await getReplay());
    await sql`update renders set order_id = ${orderId}, status = 'rendering', updated_at = now() where id = ${job.id}`;
  } catch (e) {
    await markFailed(job, e.message);
  }
}

async function settle(job) {
  const result = await ordr.check(job.order_id).catch((e) => ({ state: 'pending', progress: `status error: ${e.message}` }));
  const info = { id: job.id, order: job.order_id, state: result.state, progress: result.progress };

  if (result.state === 'done') {
    // Only the poller that flips the status sends the video, so it is never sent twice.
    const won = await sql`
      update renders set status = 'done', video_url = ${result.url}, progress = 'Done', updated_at = now()
      where id = ${job.id} and status = 'rendering' returning id`;
    if (won.length) info.sendError = await notify(job, 'Your render is ready.', result.url);
  } else if (result.state === 'failed' || Date.now() - new Date(job.created_at) > MAX_RENDER_MS) {
    await markFailed(job, result.state === 'failed' ? result.progress : 'timed out');
  } else {
    await sql`update renders set progress = ${result.progress}, updated_at = now() where id = ${job.id}`;
  }
  return info;
}

export async function pollAll() {
  const jobs = await sql`select * from renders where status = 'rendering' order by id limit 20`;
  return Promise.all(jobs.map(settle));
}
