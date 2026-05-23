-- =====================================================================
-- Phase 3.5: Assignment-based gating
-- Student must pass flagged assignment(s) of lesson A to unlock lesson B.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Refresh assignments_public to expose Phase 3 + 3.5 columns
-- (was missing io_spec, requires_manual_review)
-- ---------------------------------------------------------------------
drop view if exists assignments_public;

-- ---------------------------------------------------------------------
-- New columns on assignments
--   gates_progression: when true, lesson is considered incomplete until
--                      student's best final_score >= pass_threshold_pct
--   pass_threshold_pct: % of max_score required to pass (default 50)
-- ---------------------------------------------------------------------
alter table assignments add column gates_progression boolean not null default false;
alter table assignments add column pass_threshold_pct smallint not null default 50
  check (pass_threshold_pct between 0 and 100);

create index idx_assignments_gating on assignments(lesson_id)
  where gates_progression = true and is_published = true;

-- Recreate assignments_public with all teacher-safe columns
create view assignments_public as
  select id, lesson_id, course_id, title, description_mdx,
         starter_code, visible_tests, evaluation_type, metric_config,
         io_spec, requires_manual_review,
         gates_progression, pass_threshold_pct,
         max_score, max_attempts, time_limit_seconds, due_at, is_published
    from assignments
   where is_published = true;

grant select on assignments_public to authenticated;

-- ---------------------------------------------------------------------
-- Helper: best_final_pct(student_id, assignment_id) -> 0..100
-- Picks max(final_score / max_score * 100) across all submissions+grading_results
-- final_score = COALESCE(teacher_override_score, score)
-- ---------------------------------------------------------------------
create or replace function public.best_assignment_pct(p_student_id uuid, p_assignment_id uuid)
returns smallint
language sql
security definer
stable
as $$
  select coalesce(
    max(
      round(
        (coalesce(gr.teacher_override_score, gr.score) / nullif(gr.max_score, 0)) * 100
      )::int
    )::smallint,
    0
  )
    from submissions s
    join grading_results gr on gr.submission_id = s.id
   where s.student_id = p_student_id
     and s.assignment_id = p_assignment_id;
$$;

grant execute on function public.best_assignment_pct(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Helper: lesson_assignments_passed(student_id, lesson_id) -> boolean
-- Returns true if there are no gating assignments OR student passes ALL
-- ---------------------------------------------------------------------
create or replace function public.lesson_assignments_passed(p_student_id uuid, p_lesson_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_unmet int;
begin
  select count(*) into v_unmet
    from assignments a
   where a.lesson_id = p_lesson_id
     and a.is_published = true
     and a.gates_progression = true
     and public.best_assignment_pct(p_student_id, a.id) < a.pass_threshold_pct;
  return v_unmet = 0;
end;
$$;

grant execute on function public.lesson_assignments_passed(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Update can_access_lesson: prev lesson now also requires gating
-- assignments (if any) to be passed.
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
  v_prev_has_quiz boolean;
  v_prev_has_video_required boolean;
  v_prev_quiz_passed boolean;
  v_prev_video_pct smallint;
  v_prev_assignments_ok boolean;
begin
  select course_id, order_index, is_free_preview
    into v_course_id, v_order, v_is_free
    from lessons where id = target_lesson_id;
  if v_course_id is null then return false; end if;

  if is_teacher_of(v_course_id) or is_admin() then
    return true;
  end if;

  select exists (
    select 1 from enrollments
    where student_id = auth.uid() and course_id = v_course_id
  ) into v_enrolled;
  if not (v_enrolled or v_is_free) then return false; end if;

  if v_order = 0 then return true; end if;

  select id into v_prev_lesson_id
    from lessons
    where course_id = v_course_id and order_index < v_order
    order by order_index desc
    limit 1;
  if v_prev_lesson_id is null then return true; end if;

  select exists (select 1 from quizzes where lesson_id = v_prev_lesson_id),
         (l.video_youtube_id is not null and l.video_required)
    into v_prev_has_quiz, v_prev_has_video_required
    from lessons l where l.id = v_prev_lesson_id;

  select coalesce(lp.passed, false), coalesce(lp.video_watched_pct, 0)
    into v_prev_quiz_passed, v_prev_video_pct
    from lesson_progress lp
    where lp.student_id = auth.uid() and lp.lesson_id = v_prev_lesson_id;

  -- Quiz requirement
  if v_prev_has_quiz and not v_prev_quiz_passed then
    return false;
  end if;

  -- Video requirement
  if v_prev_has_video_required and v_prev_video_pct < 90 then
    return false;
  end if;

  -- Assignment requirement (new)
  v_prev_assignments_ok := public.lesson_assignments_passed(auth.uid(), v_prev_lesson_id);
  if not v_prev_assignments_ok then
    return false;
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- Update list_lessons_with_progress: expose has_gating_assignment +
-- assignments_passed; factor into `passed` (and therefore lock state).
-- DROP required because we change OUT signature.
-- ---------------------------------------------------------------------
drop function if exists public.list_lessons_with_progress(uuid);

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
  has_video boolean,
  has_pdf boolean,
  video_required boolean,
  has_gating_assignment boolean,
  best_quiz_score smallint,
  video_watched_pct smallint,
  assignments_passed boolean,
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
           (l.video_youtube_id is not null) as has_video,
           (l.pdf_storage_path is not null) as has_pdf,
           l.video_required,
           exists (
             select 1 from assignments a
              where a.lesson_id = l.id
                and a.is_published = true
                and a.gates_progression = true
           ) as has_gating_assignment,
           lp.best_quiz_score,
           coalesce(lp.video_watched_pct, 0) as video_watched_pct,
           coalesce(lp.passed, false) as quiz_passed,
           public.lesson_assignments_passed(v_uid, l.id) as assignments_passed
      from lessons l
      left join lesson_progress lp
        on lp.lesson_id = l.id and lp.student_id = v_uid
      where l.course_id = target_course_id
      order by l.order_index
  ),
  marked as (
    select o.*,
           ((not o.has_quiz) or o.quiz_passed)
             and ((not o.has_video) or (not o.video_required) or o.video_watched_pct >= 90)
             and o.assignments_passed
             as completed
      from ordered o
  )
  select m.id, m.module_id, m.order_index, m.title, m.estimated_minutes,
         m.is_free_preview, m.pass_threshold, m.has_quiz, m.has_video, m.has_pdf,
         m.video_required, m.has_gating_assignment,
         m.best_quiz_score, m.video_watched_pct, m.assignments_passed,
         m.completed as passed,
         case
           when v_is_teacher then false
           when m.is_free_preview then false
           when not v_enrolled then true
           when m.order_index = 0 then false
           else not coalesce(
             lag(m.completed) over (order by m.order_index),
             true
           )
         end as locked
    from marked m;
end;
$$;

grant execute on function public.list_lessons_with_progress(uuid) to authenticated;
