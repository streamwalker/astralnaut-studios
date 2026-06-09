
-- Helper: is every page of this issue published?
create or replace function public.issue_is_concluded(p_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.issues i
    where i.id = p_issue
      and (
        select count(*)
        from public.comics c
        where c.issue_id = i.id
          and c.published_at is not null
          and c.published_at <= now()
      ) >= ceil(i.total_pages)::int
      and i.total_pages > 0
  );
$$;

-- Helper: does the caller have any active subscription (live or sandbox)?
create or replace function public.has_any_active_subscription(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_subscription(p_user, 'live')
      or public.has_active_subscription(p_user, 'sandbox');
$$;

-- LETTERS ---------------------------------------------------------------
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body text not null,
  display_name text not null,
  location text,
  status text not null default 'pending',
  editor_reply text,
  feature_order int,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint letters_subject_len check (char_length(subject) between 1 and 200),
  constraint letters_body_len check (char_length(body) between 1 and 4000),
  constraint letters_display_name_len check (char_length(display_name) between 1 and 80),
  constraint letters_location_len check (location is null or char_length(location) <= 120),
  constraint letters_editor_reply_len check (editor_reply is null or char_length(editor_reply) <= 4000),
  constraint letters_status_chk check (status in ('pending','approved','rejected','hidden'))
);

create unique index letters_one_active_per_user
  on public.letters(issue_id, user_id)
  where status in ('pending','approved');

create index letters_issue_status_idx on public.letters(issue_id, status, feature_order);

grant select, insert, update, delete on public.letters to authenticated;
grant all on public.letters to service_role;

alter table public.letters enable row level security;

create policy "Subscribers can submit letters"
  on public.letters
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and editor_reply is null
    and feature_order is null
    and approved_at is null
    and approved_by is null
    and public.has_any_active_subscription(auth.uid())
  );

create policy "Authors can edit own pending letter"
  on public.letters
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and editor_reply is null
    and feature_order is null
    and approved_at is null
    and approved_by is null
  );

create policy "Read own letters"
  on public.letters
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Read approved letters of concluded issues"
  on public.letters
  for select
  to authenticated
  using (
    status = 'approved'
    and public.issue_is_concluded(issue_id)
  );

create policy "Admins manage letters"
  on public.letters
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger set_updated_at_letters
  before update on public.letters
  for each row execute function public.set_updated_at();

-- LETTER COMMENTS -------------------------------------------------------
create table public.letter_comments (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint letter_comments_body_len check (char_length(body) between 1 and 1500),
  constraint letter_comments_display_name_len check (char_length(display_name) between 1 and 80)
);

create index letter_comments_letter_idx on public.letter_comments(letter_id, created_at);

grant select, insert, update, delete on public.letter_comments to authenticated;
grant all on public.letter_comments to service_role;

alter table public.letter_comments enable row level security;

create policy "Subscribers can comment on approved letters"
  on public.letter_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and hidden = false
    and public.has_any_active_subscription(auth.uid())
    and exists (
      select 1 from public.letters l
      where l.id = letter_id
        and l.status = 'approved'
        and public.issue_is_concluded(l.issue_id)
    )
  );

create policy "Read visible comments on visible letters"
  on public.letter_comments
  for select
  to authenticated
  using (
    hidden = false
    and exists (
      select 1 from public.letters l
      where l.id = letter_id
        and l.status = 'approved'
        and public.issue_is_concluded(l.issue_id)
    )
  );

create policy "Read own comments"
  on public.letter_comments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Authors can delete own comments"
  on public.letter_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins manage letter comments"
  on public.letter_comments
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger set_updated_at_letter_comments
  before update on public.letter_comments
  for each row execute function public.set_updated_at();
