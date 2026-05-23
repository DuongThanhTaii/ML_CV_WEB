-- =====================================================================
-- Phase 2: Lesson media (PDF + YouTube video) + video progress tracking
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lesson columns: PDF storage + YouTube video
-- ---------------------------------------------------------------------
alter table lessons add column pdf_storage_path text;          -- 'lesson-pdfs/<course_id>/<lesson_id>.pdf'
alter table lessons add column pdf_size_bytes int;
alter table lessons add column video_youtube_id text
  check (video_youtube_id is null or video_youtube_id ~ '^[A-Za-z0-9_-]{11}$');
alter table lessons add column video_duration_seconds int
  check (video_duration_seconds is null or video_duration_seconds > 0);
alter table lessons add column video_title text;
alter table lessons add column video_required boolean not null default true;

-- ---------------------------------------------------------------------
-- lesson_progress: video watch tracking
-- ---------------------------------------------------------------------
alter table lesson_progress add column video_watched_pct smallint not null default 0
  check (video_watched_pct between 0 and 100);
alter table lesson_progress add column video_watched_seconds int not null default 0;
alter table lesson_progress add column video_unique_seconds_bitmap bytea;

-- ---------------------------------------------------------------------
-- Recompute `can_access_lesson` to factor video requirement
-- A lesson is "completed" when:
--   - (has quiz AND quiz passed) OR (no quiz)
--   - AND (no video OR video not required OR video_watched_pct >= 90)
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

  -- Inspect previous lesson's requirements
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

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- Extend list_lessons_with_progress to expose video info + new completion rule.
-- DROP required because we add 4 new return columns; CREATE OR REPLACE alone
-- fails with "cannot change return type of existing function" (42P13).
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
  best_quiz_score smallint,
  video_watched_pct smallint,
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
           lp.best_quiz_score,
           coalesce(lp.video_watched_pct, 0) as video_watched_pct,
           coalesce(lp.passed, false) as quiz_passed
      from lessons l
      left join lesson_progress lp
        on lp.lesson_id = l.id and lp.student_id = v_uid
      where l.course_id = target_course_id
      order by l.order_index
  ),
  marked as (
    select o.*,
           -- A lesson is "completed" if quiz requirement met AND video requirement met
           ((not o.has_quiz) or o.quiz_passed)
             and ((not o.has_video) or (not o.video_required) or o.video_watched_pct >= 90)
             as completed
      from ordered o
  )
  select m.id, m.module_id, m.order_index, m.title, m.estimated_minutes,
         m.is_free_preview, m.pass_threshold, m.has_quiz, m.has_video, m.has_pdf,
         m.video_required, m.best_quiz_score, m.video_watched_pct,
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

-- ---------------------------------------------------------------------
-- Storage bucket: lesson-pdfs (private; signed URLs only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lesson-pdfs', 'lesson-pdfs', false, 20971520, array['application/pdf']) -- 20 MB per PDF
on conflict (id) do nothing;

-- Path convention: <course_id>/<lesson_id>.pdf
-- Teachers (course owner) can upload/modify; enrolled students can read.

create policy "lesson_pdfs_teacher_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'lesson-pdfs'
    and exists (
      select 1 from courses c
      where c.id::text = (storage.foldername(name))[1]
        and (c.teacher_id = auth.uid() or is_admin())
    )
  )
  with check (
    bucket_id = 'lesson-pdfs'
    and exists (
      select 1 from courses c
      where c.id::text = (storage.foldername(name))[1]
        and (c.teacher_id = auth.uid() or is_admin())
    )
  );

create policy "lesson_pdfs_enrolled_read" on storage.objects
  for select using (
    bucket_id = 'lesson-pdfs'
    and (
      exists (
        select 1 from enrollments e
        where e.course_id::text = (storage.foldername(name))[1]
          and e.student_id = auth.uid()
      )
      or exists (
        select 1 from courses c
        where c.id::text = (storage.foldername(name))[1]
          and (c.teacher_id = auth.uid() or is_admin())
      )
    )
  );
