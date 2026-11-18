-- Row Level Security. The service-role key (publish script only, never in the app or the repo) bypasses RLS.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.competencies enable row level security;
alter table public.questions enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_competencies enable row level security;
alter table public.media enable row level security;
alter table public.diagrams enable row level security;
alter table public.question_approvals enable row level security;
alter table public.flags enable row level security;
alter table public.attempts enable row level security;
alter table public.user_notes enable row level security;

-- profiles
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- reference data: readable by signed-in users, writable by the owner
create policy sources_read on public.sources for select to authenticated using (true);
create policy sources_write on public.sources for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');
create policy competencies_read on public.competencies for select to authenticated using (true);
create policy competencies_write on public.competencies for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');

-- questions: only items from shareable sources are visible to others (owner and author always see theirs)
create policy questions_read on public.questions for select to authenticated using (
  public.current_app_role() = 'owner'
  or created_by = auth.uid()
  or exists (select 1 from public.sources s where s.id = questions.source_id and s.shareable)
);
create policy questions_insert on public.questions for insert to authenticated
  with check (created_by = auth.uid() and status = 'unverified');
create policy questions_update on public.questions for update to authenticated
  using (created_by = auth.uid() or public.current_app_role() = 'owner')
  with check (created_by = auth.uid() or public.current_app_role() = 'owner');
create policy questions_delete on public.questions for delete to authenticated
  using (public.current_app_role() = 'owner');

-- lessons: hidden if any cited source is not shareable (unless owner/author)
create policy lessons_read on public.lessons for select to authenticated using (
  public.current_app_role() = 'owner'
  or created_by = auth.uid()
  or not exists (
    select 1 from public.sources s where s.id = any (lessons.source_ids) and not s.shareable
  )
);
create policy lessons_write on public.lessons for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');
create policy lesson_comp_read on public.lesson_competencies for select to authenticated using (true);
create policy lesson_comp_write on public.lesson_competencies for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');

-- media and diagrams
create policy media_read on public.media for select to authenticated using (true);
create policy media_write on public.media for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');
create policy diagrams_read on public.diagrams for select to authenticated using (true);
create policy diagrams_write on public.diagrams for all to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');

-- approvals: anyone signed in may approve as themselves (the trigger blocks self-approval and stale reviews)
create policy approvals_read on public.question_approvals for select to authenticated using (true);
create policy approvals_insert on public.question_approvals for insert to authenticated
  with check (user_id = auth.uid());
create policy approvals_delete_own on public.question_approvals for delete to authenticated
  using (user_id = auth.uid());

-- flags
create policy flags_insert on public.flags for insert to authenticated with check (user_id = auth.uid());
create policy flags_read on public.flags for select to authenticated
  using (user_id = auth.uid() or public.current_app_role() = 'owner');
create policy flags_update_owner on public.flags for update to authenticated
  using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');

-- attempts: private to each user
create policy attempts_own on public.attempts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notes: private unless shared
create policy notes_read on public.user_notes for select to authenticated using (user_id = auth.uid() or shared);
create policy notes_write on public.user_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
