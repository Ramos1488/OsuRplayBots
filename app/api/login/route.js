import { NextResponse } from 'next/server';
import { makeToken, safeEq } from '@/lib/auth';

export async function POST(req) {
  const f = await req.formData();
  const ok = process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD &&
    safeEq(f.get('username') || '', process.env.ADMIN_USERNAME) && safeEq(f.get('password') || '', process.env.ADMIN_PASSWORD);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.redirect(new URL('/login?e=1', req.url), 303);
  }
  const res = NextResponse.redirect(new URL('/admin', req.url), 303);
  res.cookies.set('session', makeToken(), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
  return res;
}
