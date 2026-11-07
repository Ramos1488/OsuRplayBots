export default function Login({ searchParams }) {
  return (
    <main className="narrow">
      <h1>Replay Desk</h1>
      <form method="post" action="/api/login" className="stack">
        <input name="username" placeholder="Username" autoComplete="username" required />
        <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
        {searchParams.e && <p className="err">Wrong username or password.</p>}
        <button>Sign in</button>
      </form>
    </main>
  );
}
