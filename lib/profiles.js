import { sql } from './db';

export async function getLinked(platform, userId) {
  const [row] = await sql`select osu_username from osu_links where platform = ${platform} and user_id = ${String(userId)}`;
  return row?.osu_username;
}

export async function setLinked(platform, userId, name) {
  await sql`insert into osu_links (platform, user_id, osu_username) values (${platform}, ${String(userId)}, ${name})
    on conflict (platform, user_id) do update set osu_username = ${name}`;
}
