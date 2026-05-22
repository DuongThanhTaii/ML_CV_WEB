-- =====================================================================
-- Row Level Security policies
-- =====================================================================

-- Helper: is_teacher_of(course_id)
create or replace function public.is_teacher_of(course_uuid uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from courses c
    where c.id = course_uuid and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- =====================================================================
-- profiles
-- =====================================================================
alter table profiles enable row level security;

create policy "profiles_select_all" on profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on profiles
  for update to authenticated using (auth.uid() = id)
  with check (auth.uid() = id);

-- =====================================================================
-- courses
-- =====================================================================
alter table courses enable row level security;

create policy "courses_select_published" on courses
  for select using (is_published = true or teacher_id = auth.uid() or is_admin());

create policy "courses_insert_teacher" on courses
  for insert to authenticated with check (
    teacher_id = auth.uid() and exists (
      select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "courses_update_own" on courses
  for update to authenticated using (teacher_id = auth.uid() or is_admin());

create policy "courses_delete_own" on courses
  for delete to authenticated using (teacher_id = auth.uid() or is_admin());

-- =====================================================================
-- enrollments
-- =====================================================================
alter table enrollments enable row level security;

create policy "enrollments_select_own_or_teacher" on enrollments
  for select using (
    student_id = auth.uid() or is_teacher_of(course_id) or is_admin()
  );

create policy "enrollments_insert_own" on enrollments
  for insert to authenticated with check (student_id = auth.uid());

create policy "enrollments_update_own" on enrollments
  for update to authenticated using (student_id = auth.uid());

-- =====================================================================
-- lessons
-- =====================================================================
alter table lessons enable row level security;

create policy "lessons_select" on lessons
  for select using (
    exists (
      select 1 from courses c
      where c.id = lessons.course_id
        and (c.is_published or c.teacher_id = auth.uid() or is_admin())
    )
  );

create policy "lessons_modify_teacher" on lessons
  for all to authenticated
  using (is_teacher_of(course_id) or is_admin())
  with check (is_teacher_of(course_id) or is_admin());

-- =====================================================================
-- assignments
-- =====================================================================
alter table assignments enable row level security;

-- App MUST use the assignments_public view to read. Direct select restricted:
create policy "assignments_select_teacher_only" on assignments
  for select using (is_teacher_of(course_id) or is_admin());

create policy "assignments_modify_teacher" on assignments
  for all to authenticated
  using (is_teacher_of(course_id) or is_admin())
  with check (is_teacher_of(course_id) or is_admin());

-- Grant select on the safe view to authenticated users
grant select on assignments_public to authenticated;

-- =====================================================================
-- submissions
-- =====================================================================
alter table submissions enable row level security;

create policy "submissions_select_own" on submissions
  for select using (student_id = auth.uid());

create policy "submissions_select_teacher" on submissions
  for select using (
    exists (
      select 1 from assignments a
      where a.id = submissions.assignment_id and is_teacher_of(a.course_id)
    ) or is_admin()
  );

create policy "submissions_insert_own" on submissions
  for insert to authenticated with check (student_id = auth.uid());

-- =====================================================================
-- grading_results
-- =====================================================================
alter table grading_results enable row level security;

create policy "grading_select_own_or_teacher" on grading_results
  for select using (
    exists (
      select 1 from submissions s
      where s.id = grading_results.submission_id
        and (s.student_id = auth.uid()
             or exists (select 1 from assignments a where a.id = s.assignment_id and is_teacher_of(a.course_id))
             or is_admin())
    )
  );

-- INSERT only via service role from Edge Function — no policy needed.

-- =====================================================================
-- ai_feedback, ai_chat_*
-- =====================================================================
alter table ai_feedback enable row level security;
alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;

create policy "ai_feedback_select_own" on ai_feedback
  for select using (
    exists (
      select 1 from submissions s
      where s.id = ai_feedback.submission_id and s.student_id = auth.uid()
    )
  );

create policy "chat_sessions_own" on ai_chat_sessions
  for all to authenticated using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "chat_messages_own" on ai_chat_messages
  for all to authenticated using (
    exists (select 1 from ai_chat_sessions s where s.id = ai_chat_messages.session_id and s.student_id = auth.uid())
  );

-- =====================================================================
-- datasets, notebooks, experiments, quizzes
-- =====================================================================
alter table datasets enable row level security;
alter table notebooks enable row level security;
alter table experiments enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;

create policy "datasets_select" on datasets
  for select using (owner_id = auth.uid() or is_public = true);
create policy "datasets_modify_own" on datasets
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "notebooks_own" on notebooks
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "experiments_own" on experiments
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "quizzes_select" on quizzes
  for select using (true);
create policy "quizzes_modify_teacher" on quizzes
  for all to authenticated using (
    exists (select 1 from lessons l where l.id = quizzes.lesson_id and is_teacher_of(l.course_id))
    or is_admin()
  );

create policy "quiz_attempts_own" on quiz_attempts
  for all to authenticated using (student_id = auth.uid())
  with check (student_id = auth.uid());
