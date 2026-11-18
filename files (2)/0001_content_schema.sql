-- VDMLearn content schema (author draft, not yet run against a live Supabase project)
-- Source of truth for authored content = Git (content/ folder). This database is the published, queryable copy plus user data.
-- Free-plan note: no automatic backups on the free plan, so keep Git as the master and export user data regularly.

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed

-- ---------- people ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('owner', 'verifier', 'member')),
  created_at timestamptz not null default now()
);

-- first account becomes owner (solo first), later accounts are members
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when (select count(*) from public.profiles) = 0 then 'owner' else 'member' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- reference data ----------
create table public.sources (
  id text primary key,
  title text not null,
  type text not null,
  license text,
  ai_ingestion text,
  shareable boolean not null default false,
  url text,
  notes text,
  checked_on date
);

-- PRC competencies (scheme PRC) and Year 0 topics (scheme PRE)
create table public.competencies (
  id text primary key,                         -- 'Veterinary Pharmacology:A.3' or 'PRE:GENCHEM:E.1'
  scheme text not null check (scheme in ('PRC', 'PRE')),
  subject text not null,
  section_id text,
  name text not null,
  items integer,                               -- items out of 100 in the subject exam (PRC only)
  exam_weight_pct numeric,                     -- subject weight in the whole exam (PRC only)
  parent_id text references public.competencies (id)
);

-- ---------- authored content ----------
create table public.questions (
  id text primary key,
  year smallint not null check (year between 0 and 6),
  school text check (school in ('UPLB', 'CLSU', 'PSAU', 'CHED')),
  vmle_subject text,
  competency_id text not null references public.competencies (id),
  stem text not null,
  choices jsonb not null,
  answer char(1) not null check (answer in ('A', 'B', 'C', 'D')),
  explanation text not null,
  source_type text not null check (source_type in ('own-notes', 'ai-draft', 'open-reference', 'hand-written')),
  source text not null,                        -- locator text, e.g. 'Biology 2e ch. 4.2'
  source_id text not null references public.sources (id),
  status text not null default 'unverified' check (status in ('unverified', 'verified')),
  content_hash text,
  created_by uuid references auth.users (id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint choices_four check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) = 4)
);
create index questions_competency_idx on public.questions (competency_id);
create index questions_subject_idx on public.questions (vmle_subject, status);

create table public.lessons (
  id text primary key,
  title text not null,
  track text not null,
  year smallint not null check (year between 0 and 6),
  vmle_subject text,
  objectives jsonb not null default '[]'::jsonb,
  body_md text not null,
  diagram_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  verify_against text,
  status text not null default 'unverified' check (status in ('unverified', 'verified')),
  version integer not null default 1,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_competencies (
  lesson_id text not null references public.lessons (id) on delete cascade,
  competency_id text not null references public.competencies (id),
  primary key (lesson_id, competency_id)
);

create table public.media (
  id text primary key,
  kind text not null,
  storage_path text not null,                  -- path inside the storage bucket
  license text not null,
  attribution text,
  source_id text not null references public.sources (id),
  species text
);

create table public.diagrams (
  id text primary key,
  title text not null,
  media_id text references public.media (id),
  hotspots jsonb,
  competency_ids text[] not null default '{}'
);

-- ---------- review workflow ----------
create table public.question_approvals (
  question_id text not null references public.questions (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  content_hash text not null,                  -- the exact content the reviewer checked
  source_cited text not null check (length(trim(source_cited)) > 0),
  approved_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

create table public.flags (
  id bigint generated always as identity primary key,
  question_id text not null references public.questions (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- ---------- user data (append-only attempts, private notes) ----------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id),
  chosen char(1) check (chosen in ('A', 'B', 'C', 'D')),
  correct boolean not null,
  confidence smallint check (confidence between 1 and 3),
  response_ms integer,
  rating smallint check (rating between 1 and 4),
  mode text,
  session_id uuid,
  ts timestamptz not null default now()
);
create index attempts_user_ts_idx on public.attempts (user_id, ts desc);

create table public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competency_id text references public.competencies (id),
  body_md text not null,
  shared boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- triggers ----------
create or replace function public.questions_before_write()
returns trigger
language plpgsql
as $$
begin
  new.content_hash := md5(new.stem || new.choices::text || new.answer || new.explanation);
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
    -- any edit to the reviewed content drops verification (old approvals no longer match the hash)
    if new.content_hash is distinct from old.content_hash then
      new.status := 'unverified';
    end if;
  end if;
  return new;
end;
$$;

create trigger questions_before_write
before insert or update on public.questions
for each row execute function public.questions_before_write();

create or replace function public.lessons_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create trigger lessons_before_write
before insert or update on public.lessons
for each row execute function public.lessons_before_write();

-- approvals: no self-approval, and the review must match the current content
create or replace function public.approvals_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
  current_hash text;
begin
  select created_by, content_hash into author, current_hash
  from public.questions where id = new.question_id;
  if author is not null and author = new.user_id then
    raise exception 'authors cannot approve their own question';
  end if;
  if current_hash is distinct from new.content_hash then
    raise exception 'stale review: the question changed since it was read';
  end if;
  return new;
end;
$$;

create trigger approvals_guard
before insert on public.question_approvals
for each row execute function public.approvals_guard();

-- verified = at least 2 distinct approvers on the CURRENT content
create or replace function public.approvals_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  qid text;
  n integer;
begin
  qid := coalesce(new.question_id, old.question_id);
  select count(distinct a.user_id) into n
  from public.question_approvals a
  join public.questions q on q.id = a.question_id and q.content_hash = a.content_hash
  where a.question_id = qid;
  update public.questions
  set status = case when n >= 2 then 'verified' else 'unverified' end
  where id = qid
    and status is distinct from case when n >= 2 then 'verified' else 'unverified' end;
  return null;
end;
$$;

create trigger approvals_recompute
after insert or delete on public.question_approvals
for each row execute function public.approvals_recompute();

-- ---------- coverage view (respects RLS of the caller) ----------
create view public.coverage
with (security_invoker = true) as
select
  c.id as competency_id,
  c.scheme,
  c.subject,
  c.name,
  c.items as exam_items,
  count(q.id) as questions_total,
  count(q.id) filter (where q.status = 'verified') as questions_verified
from public.competencies c
left join public.questions q on q.competency_id = c.id
group by c.id, c.scheme, c.subject, c.name, c.items;
