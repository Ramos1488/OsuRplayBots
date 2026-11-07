'use client';
import { useEffect, useState } from 'react';

export default function Live({ initial }) {
  const [d, setD] = useState(initial);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let stop = false, t;
    const tick = async () => {
      if (!document.hidden) {
        try {
          const r = await fetch('/api/renders', { cache: 'no-store' });
          if (r.status === 401) { location.href = '/login'; return; }
          if (r.ok) { setD(await r.json()); setOnline(true); } else setOnline(false);
        } catch { setOnline(false); }
      }
      if (!stop) t = setTimeout(tick, 4000);
    };
    t = setTimeout(tick, 4000);
    return () => { stop = true; clearTimeout(t); };
  }, []);

  const { rows, counts: c } = d;
  return (
    <>
      <p className="sum">
        <b>{c.rendering}</b> rendering, <b>{c.done}</b> finished, <b>{c.failed}</b> failed.
        <span className={`live ${online ? '' : 'off'}`}>{online ? 'Live' : 'Offline'}</span>
      </p>
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
                    {r.status === 'rendering' && <small className="mute"> {r.progress}</small>}
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
    </>
  );
}
