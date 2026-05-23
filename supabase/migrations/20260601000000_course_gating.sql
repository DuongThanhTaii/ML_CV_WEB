-- =====================================================================
-- Phase 1: Course gating + Quiz infrastructure
-- =====================================================================

-- ---------------------------------------------------------------------
-- Modules: group lessons inside a course (Coursera-style)
-- ---------------------------------------------------------------------
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  unique (course_id, order_index)
);
create index idx_modules_course on modules(course_id, order_index);

-- Lessons get an optional module + a pass threshold for the quiz gate
alter table lessons add column module_id uuid references modules(id) on delete set null;
alter table lessons add column pass_threshold smallint not null default 70
  check (pass_threshold between 0 and 100);
create index idx_lessons_module on lessons(module_id, order_index);

-- ---------------------------------------------------------------------
-- Quizzes: extend with order + points
-- ---------------------------------------------------------------------
alter table quizzes add column order_index int not null default 0;
alter table quizzes add column points smallint not null default 1 check (points > 0);
create index idx_quizzes_lesson on quizzes(lesson_id, order_index);

-- ---------------------------------------------------------------------
-- lesson_progress: per-student per-lesson completion state
-- ---------------------------------------------------------------------
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  best_quiz_score smallint check (best_quiz_score between 0 and 100),
  quiz_attempts_count int not null default 0,
  passed boolean not null default false,
  first_viewed_at timestamptz default now(),
  passed_at timestamptz,
  updated_at timestamptz default now(),
  unique (student_id, lesson_id)
);
create index idx_lesson_progress_student on lesson_progress(student_id, passed);
create index idx_lesson_progress_lesson on lesson_progress(lesson_id);

create trigger trg_lesson_progress_updated before update on lesson_progress
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Tighten quiz RLS: student-facing reads MUST go through quizzes_public view
-- (which omits correct_answer + explanation). Prior policy `quizzes_select USING (true)`
-- leaked answers via direct supabase-js queries.
-- ---------------------------------------------------------------------
drop policy if exists "quizzes_select" on quizzes;

create policy "quizzes_select_teacher" on quizzes
  for select using (
    exists (
      select 1 from lessons l where l.id = quizzes.lesson_id and is_teacher_of(l.course_id)
    )
    or is_admin()
  );

create or replace view quizzes_public as
  select id, lesson_id, question_type, question, options, difficulty, order_index, points
    from quizzes;

grant select on quizzes_public to authenticated, anon;

-- ---------------------------------------------------------------------
-- RLS: modules
-- ---------------------------------------------------------------------
alter table modules enable row level security;

create policy "modules_select" on modules
  for select using (
    exists (
      select 1 from courses c
      where c.id = modules.course_id
        and (c.is_published or c.teacher_id = auth.uid() or is_admin())
    )
  );

create policy "modules_modify_teacher" on modules
  for all to authenticated
  using (is_teacher_of(course_id) or is_admin())
  with check (is_teacher_of(course_id) or is_admin());

-- ---------------------------------------------------------------------
-- RLS: lesson_progress
-- ---------------------------------------------------------------------
alter table lesson_progress enable row level security;

create policy "lesson_progress_select_own_or_teacher" on lesson_progress
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from lessons l
      where l.id = lesson_progress.lesson_id and is_teacher_of(l.course_id)
    )
    or is_admin()
  );

create policy "lesson_progress_insert_own" on lesson_progress
  for insert to authenticated with check (student_id = auth.uid());

create policy "lesson_progress_update_own" on lesson_progress
  for update to authenticated using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ---------------------------------------------------------------------
-- RPC: can_access_lesson(lesson_id) -> boolean
-- Checks: enrolled in course, AND (lesson has order_index 0 OR prev lesson passed)
-- ---------------------------------------------------------------------
create or replace function public.can_access_lesson(target_lesson_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_course_id uuid;
  v_order int;
  v_is_free boolean;
  v_enrolled boolean;
  v_prev_lesson_id uuid;
  v_prev_passed boolean;
begin
  -- Lesson must exist
  select course_id, order_index, is_free_preview
    into v_course_id, v_order, v_is_free
    from lessons where id = target_lesson_id;
  if v_course_id is null then return false; end if;

  -- Teacher/admin always passes
  if is_teacher_of(v_course_id) or is_admin() then
    return true;
  end if;

  -- Must be enrolled (unless free preview)
  select exists (
    select 1 from enrollments
    where student_id = auth.uid() and course_id = v_course_id
  ) into v_enrolled;
  if not (v_enrolled or v_is_free) then return false; end if;

  -- First lesson in course is always accessible once enrolled
  if v_order = 0 then return true; end if;

  -- Find previous lesson by order_index within same course
  select id into v_prev_lesson_id
    from lessons
    where course_id = v_course_id and order_index < v_order
    order by order_index desc
    limit 1;
  if v_prev_lesson_id is null then return true; end if;

  -- Previous lesson must be passed (no quiz → auto-pass if no questions exist)
  select coalesce(lp.passed, false) into v_prev_passed
    from lesson_progress lp
    where lp.student_id = auth.uid() and lp.lesson_id = v_prev_lesson_id;

  if v_prev_passed then return true; end if;

  -- If previous lesson has no quiz questions, treat as passed
  if not exists (select 1 from quizzes where lesson_id = v_prev_lesson_id) then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.can_access_lesson(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RPC: list_lessons_with_progress(course_id) -> table of lessons + lock state
-- ---------------------------------------------------------------------
create or replace function public.list_lessons_with_progress(target_course_id uuid)
returns table (
  id uuid,
  module_id uuid,
  order_index int,
  title text,
  estimated_minutes int,
  is_free_preview boolean,
  pass_threshold smallint,
  has_quiz boolean,
  best_quiz_score smallint,
  passed boolean,
  locked boolean
)
language plpgsql
security definer
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_is_teacher boolean := is_teacher_of(target_course_id) or is_admin();
  v_enrolled boolean := exists (
    select 1 from enrollments where student_id = v_uid and course_id = target_course_id
  );
begin
  return query
  with ordered as (
    select l.id, l.module_id, l.order_index, l.title, l.estimated_minutes,
           l.is_free_preview, l.pass_threshold,
           exists (select 1 from quizzes q where q.lesson_id = l.id) as has_quiz,
           lp.best_quiz_score,
           coalesce(lp.passed, false) as passed
      from lessons l
      left join lesson_progress lp
        on lp.lesson_id = l.id and lp.student_id = v_uid
      where l.course_id = target_course_id
      order by l.order_index
  )
  select o.id, o.module_id, o.order_index, o.title, o.estimated_minutes,
         o.is_free_preview, o.pass_threshold, o.has_quiz,
         o.best_quiz_score, o.passed,
         case
           when v_is_teacher then false
           when o.is_free_preview then false
           when not v_enrolled then true
           when o.order_index = 0 then false
           else not coalesce(
             lag(o.passed or not o.has_quiz) over (order by o.order_index),
             true
           )
         end as locked
    from ordered o;
end;
$$;

grant execute on function public.list_lessons_with_progress(uuid) to authenticated;
