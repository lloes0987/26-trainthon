-- meethere database schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create table rooms (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date_candidates date[] not null,
  time_start time not null,
  time_end time not null,
  share_code text unique not null,
  enable_location boolean not null default false,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade,
  display_id text not null,
  password_hash text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  session_token text not null,
  joined_at timestamptz not null default now(),
  unique (room_id, display_id)
);

create table availability_slots (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  slot_date date not null,
  time_slot time not null,
  available boolean not null default true,
  unique (participant_id, slot_date, time_slot)
);

create table participant_locations (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid not null references participants(id) on delete cascade unique,
  address text not null,
  lat double precision not null,
  lng double precision not null
);

create table final_decisions (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade unique,
  final_date date,
  final_start_time time,
  final_end_time time,
  final_place text,
  created_at timestamptz not null default now()
);

create index idx_participants_room on participants(room_id);
create index idx_availability_room on availability_slots(room_id);
create index idx_availability_participant on availability_slots(participant_id);
create index idx_rooms_share_code on rooms(share_code);

alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table availability_slots;

alter table rooms enable row level security;
alter table participants enable row level security;
alter table availability_slots enable row level security;
alter table participant_locations enable row level security;
alter table final_decisions enable row level security;

create policy "rooms are public read" on rooms for select using (true);
create policy "rooms are public insert" on rooms for insert with check (true);

create policy "participants are public read" on participants for select using (true);
create policy "participants are public insert" on participants for insert with check (true);
create policy "participants are public update" on participants for update using (true);

create policy "availability are public read" on availability_slots for select using (true);
create policy "availability are public insert" on availability_slots for insert with check (true);
create policy "availability are public update" on availability_slots for update using (true);
create policy "availability are public delete" on availability_slots for delete using (true);

create policy "locations are public read" on participant_locations for select using (true);
create policy "locations are public insert" on participant_locations for insert with check (true);
create policy "locations are public update" on participant_locations for update using (true);

create policy "decisions are public read" on final_decisions for select using (true);
create policy "decisions are public insert" on final_decisions for insert with check (true);
create policy "decisions are public update" on final_decisions for update using (true);
