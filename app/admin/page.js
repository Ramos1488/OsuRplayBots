import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!isAdmin()) redirect('/login');
  const [rows, [{ rendering, done, failed }]] = await Promise.all([
    sql`select * from renders order by id desc limit 50`,
    sql`select count(*) filter (where status = 'rendering')::int as rendering,
      count(*) filter (where status = 'done')::int as done,
      count(*) filter (where status = 'failed')::int as failed from renders`,
  ]);
  return (
    <main>
      <header>
        <h1>Replay Desk</h1>
        <div className="row">
          <a href="/api/setup" target="_blank">Connect bots</a>
          <form method="post" action="/api/logout"><button className="ghost">Sign out</button></form>
        </div>
      </header>
      <p className="sum"><b>{rendering}</b> rendering, <b>{done}</b> finished, <b>{failed}</b> failed.</p>
      <div className="wrap">
        <table>
          <thead><tr><th>Time</th><th>Bot</th><th>From</th><th>Status</th><th>Video</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="5">No renders yet. Send an .osr file to a bot.</td></tr>}
            {rows.map((r) => {
              const pct = Number(/(\d+)%/.exec(r.progress || '')?.[1] || 0);
              return (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'UTC' })}</td>
                  <td>{r.platform}</td>
                  <td>{r.requester || '-'}</td>
                  <td>
                    <span className={`tag ${r.status}`}>{r.status}</span>
                    {r.status === 'rendering' && <div className="bar"><i style={{ width: `${pct}%` }} /></div>}
                    {r.error && <small className="err"> {r.error}</small>}
                  </td>
                  <td>{r.video_url ? <a href={r.video_url} target="_blank">Open</a> : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
