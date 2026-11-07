import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';

const count = async (s) => (await db.from('renders').select('*', { count: 'exact', head: true }).eq('status', s)).count || 0;

export default async function Admin() {
  if (!isAdmin()) redirect('/login');
  const [{ data: rows = [] }, rendering, done, failed] = await Promise.all([
    db.from('renders').select('*').order('id', { ascending: false }).limit(50),
    count('rendering'), count('done'), count('failed'),
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
