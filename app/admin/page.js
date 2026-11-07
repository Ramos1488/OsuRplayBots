import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getData } from '@/lib/data';
import Live from './Live';
export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!isAdmin()) redirect('/login');
  const initial = JSON.parse(JSON.stringify(await getData()));
  return (
    <main>
      <header>
        <h1>Replay Desk</h1>
        <div className="row">
          <a href="/api/setup" target="_blank">Connect bots</a>
          <form method="post" action="/api/logout"><button className="ghost">Sign out</button></form>
        </div>
      </header>
      <Live initial={initial} />
    </main>
  );
}
