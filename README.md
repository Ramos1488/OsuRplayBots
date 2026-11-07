# Replay Desk

Telegram + Discord osu! replay render bots (via o!rdr) with an admin panel. Runs on Vercel + Supabase, no custom domain needed.

1. Run `supabase.sql` in the Supabase SQL editor.
2. Add every variable from `.env.example` in Vercel > Settings > Environment Variables, then deploy.
3. Discord Developer Portal > General Information > Interactions Endpoint URL: `https://YOUR-SITE.vercel.app/api/discord`.
4. Open `/login`, sign in, click "Connect bots" (sets the Telegram webhook, registers `/render`).
5. cron-job.org: GET `https://YOUR-SITE.vercel.app/api/poll?key=CRON_SECRET` every minute.

Notes: without `ORDR_KEY` o!rdr allows about one render per 5 minutes. Discord replies only work for 15 minutes after the command.
