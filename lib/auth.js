import crypto from 'crypto';
import { cookies } from 'next/headers';
const sign = (v) => crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(v).digest('base64url');
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();
export const safeEq = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));
export function makeToken() {
  const v = `admin.${Date.now() + 7 * 864e5}`;
  return `${v}.${sign(v)}`;
}
export function isAdmin() {
  const t = cookies().get('session')?.value;
  if (!t || !process.env.SESSION_SECRET) return false;
  const i = t.lastIndexOf('.');
  const v = t.slice(0, i);
  return safeEq(t.slice(i + 1), sign(v)) && Number(v.split('.')[1]) > Date.now();
}
