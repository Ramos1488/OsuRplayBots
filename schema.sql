create table renders (
  id bigint generated always as identity primary key,
  platform text not null,
  chat_id text, reply_to text, discord_token text,
  requester text,
  order_id bigint,
  status text not null default 'new',
  progress text, video_url text, error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists osu_links (
  platform text not null,
  user_id text not null,
  osu_username text not null,
  primary key (platform, user_id)
);
