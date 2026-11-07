// osu! API v2 (client credentials). Works in both Node and Edge runtimes.
const API = 'https://osu.ppy.sh/api/v2';
let token = { value: null, expires: 0 };

export const MODES = { osu: 'osu', taiko: 'taiko', fruits: 'fruits', mania: 'mania' };

async function getToken() {
  if (token.value && Date.now() < token.expires) return token.value;
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      client_id: Number(process.env.OSU_CLIENT_ID), client_secret: process.env.OSU_CLIENT_SECRET,
      grant_type: 'client_credentials', scope: 'public',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('osu! API login failed: check OSU_CLIENT_ID and OSU_CLIENT_SECRET.');
  token = { value: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 };
  return token.value;
}

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${await getToken()}`, accept: 'application/json' }, cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`osu! API error ${res.status}`);
  return res.json();
}

export const getUser = (id, mode = 'osu') => get(`/users/${id}/${mode}?key=id`);
export const findUser = (name, mode = 'osu') => get(`/users/${encodeURIComponent(name)}/${mode}?key=username`);
export const recentByUserId = async (id, mode = 'osu') =>
  (await get(`/users/${id}/scores/recent?include_fails=1&limit=1&mode=${mode}`))?.[0] ?? null;

// -> { error } or { user, title, url } where url is the card image
export async function recentCard(name, mode, origin) {
  const user = await findUser(name, mode);
  if (!user) return { error: `Player "${name}" not found.` };
  const score = await recentByUserId(user.id, mode);
  if (!score) return { error: `${user.username} has no recent plays in this mode.` };
  return {
    user: user.username,
    title: `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`,
    url: `${origin}/api/card?id=${user.id}&m=${mode}&t=${Date.now()}`, // t: stops Telegram/Discord caching an old card
  };
}
