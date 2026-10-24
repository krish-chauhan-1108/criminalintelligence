create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  city text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  situation text not null,
  result jsonb,
  is_criminal boolean,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.analyses to authenticated;
grant all on public.analyses to service_role;
alter table public.analyses enable row level security;
create policy "own analyses read" on public.analyses for select to authenticated using (auth.uid() = user_id);
create policy "own analyses insert" on public.analyses for insert to authenticated with check (auth.uid() = user_id);
create policy "own analyses delete" on public.analyses for delete to authenticated using (auth.uid() = user_id);

create table public.lawyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text not null,
  specialisation text not null,
  city text not null,
  offers_call boolean not null default true,
  offers_chat boolean not null default true,
  offers_in_person boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.lawyers to authenticated;
grant all on public.lawyers to service_role;
alter table public.lawyers enable row level security;
create policy "approved lawyers visible" on public.lawyers for select to authenticated using (approved = true);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lawyer_id uuid references public.lawyers(id) on delete set null,
  lawyer_name text not null,
  consult_type text not null default 'call',
  status text not null default 'requested',
  scheduled_for timestamptz,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.consultations to authenticated;
grant all on public.consultations to service_role;
alter table public.consultations enable row level security;
create policy "own consults read" on public.consultations for select to authenticated using (auth.uid() = user_id);
create policy "own consults insert" on public.consultations for insert to authenticated with check (auth.uid() = user_id);
create policy "own consults update" on public.consultations for update to authenticated using (auth.uid() = user_id);

create table public.research_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.research_waitlist to authenticated;
grant all on public.research_waitlist to service_role;
alter table public.research_waitlist enable row level security;
create policy "own waitlist read" on public.research_waitlist for select to authenticated using (auth.uid() = user_id);
create policy "own waitlist insert" on public.research_waitlist for insert to authenticated with check (auth.uid() = user_id);

create table public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  query text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.searches to authenticated;
grant all on public.searches to service_role;
alter table public.searches enable row level security;
create policy "own searches read" on public.searches for select to authenticated using (auth.uid() = user_id);
create policy "own searches insert" on public.searches for insert to authenticated with check (auth.uid() = user_id);