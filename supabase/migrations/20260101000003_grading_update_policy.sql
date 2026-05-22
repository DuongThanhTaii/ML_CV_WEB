-- Allow teachers to override grading_results.score for submissions in their courses.

create policy "grading_update_teacher" on grading_results
  for update to authenticated
  using (
    exists (
      select 1 from submissions s
      join assignments a on a.id = s.assignment_id
      where s.id = grading_results.submission_id and is_teacher_of(a.course_id)
    )
    or is_admin()
  );
