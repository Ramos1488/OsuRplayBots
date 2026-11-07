import { sql } from './db';

export async function getData() {
  const [rows, [counts]] = await Promise.all([
    sql`select id, platform, requester, status, progress, video_url, error, created_at from renders order by id desc limit 50`,
    sql`select count(*) filter (where status = 'rendering')::int as rendering,
      count(*) filter (where status = 'done')::int as done,
      count(*) filter (where status = 'failed')::int as failed from renders`,
  ]);
  return { rows, counts };
}
