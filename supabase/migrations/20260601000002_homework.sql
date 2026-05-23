-- =====================================================================
-- Phase 3: Homework (dataset-attached assignments + manual review)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Assignment ↔ Dataset junction (one assignment can use multiple datasets,
-- each with a role: train / test / validation / reference)
-- ---------------------------------------------------------------------
create table assignment_datasets (
  assignment_id uuid not null references assignments(id) on delete cascade,
  dataset_id uuid not null references datasets(id) on delete restrict,
  role text not null check (role in ('train', 'test', 'validation', 'reference')),
  created_at timestamptz default now(),
  primary key (assignment_id, dataset_id, role)
);
create index idx_assignment_datasets_assignment on assignment_datasets(assignment_id);
create index idx_assignment_datasets_dataset on assignment_datasets(dataset_id);

-- ---------------------------------------------------------------------
-- I/O spec + manual review flag
-- ---------------------------------------------------------------------
alter table assignments add column io_spec jsonb;
-- Shape:
-- {
--   "function_name": "predict",
--   "inputs":  [{ "name": "X", "type": "DataFrame|ndarray|Image", "shape": "(n, 4)" }],
--   "outputs": [{ "name": "y_pred", "type": "ndarray", "shape": "(n,)", "dtype": "int" }],
--   "algorithm_hint": "Try sklearn.ensemble.RandomForestClassifier",
--   "algorithm_required": false
-- }

alter table assignments add column requires_manual_review boolean not null default false;

-- ---------------------------------------------------------------------
-- grading_results: teacher override + comment
-- ---------------------------------------------------------------------
alter table grading_results add column teacher_override_score numeric(5,2)
  check (teacher_override_score is null or teacher_override_score >= 0);
alter table grading_results add column teacher_comment text;
alter table grading_results add column reviewed_by uuid references profiles(id);
alter table grading_results add column reviewed_at timestamptz;

-- Convenience view: final_score = COALESCE(teacher_override_score, score)
create or replace view grading_results_view as
  select gr.*,
         coalesce(gr.teacher_override_score, gr.score) as final_score
    from grading_results gr;

grant select on grading_results_view to authenticated;

-- ---------------------------------------------------------------------
-- Update grading_update_policy to allow teacher override
-- (existing policy 20260101000003 may not include teacher override columns)
-- ---------------------------------------------------------------------
drop policy if exists "grading_update_teacher" on grading_results;
create policy "grading_update_teacher" on grading_results
  for update to authenticated using (
    exists (
      select 1 from submissions s
      join assignments a on a.id = s.assignment_id
      where s.id = grading_results.submission_id and is_teacher_of(a.course_id)
    )
    or is_admin()
  ) with check (
    exists (
      select 1 from submissions s
      join assignments a on a.id = s.assignment_id
      where s.id = grading_results.submission_id and is_teacher_of(a.course_id)
    )
    or is_admin()
  );

-- ---------------------------------------------------------------------
-- RLS: assignment_datasets — teacher of the course owns; students read
-- only published assignment's dataset list
-- ---------------------------------------------------------------------
alter table assignment_datasets enable row level security;

create policy "assignment_datasets_select" on assignment_datasets
  for select using (
    exists (
      select 1 from assignments a
      where a.id = assignment_datasets.assignment_id
        and (
          a.is_published
          or is_teacher_of(a.course_id)
          or is_admin()
        )
    )
  );

create policy "assignment_datasets_modify_teacher" on assignment_datasets
  for all to authenticated using (
    exists (
      select 1 from assignments a
      where a.id = assignment_datasets.assignment_id
        and (is_teacher_of(a.course_id) or is_admin())
    )
  ) with check (
    exists (
      select 1 from assignments a
      where a.id = assignment_datasets.assignment_id
        and (is_teacher_of(a.course_id) or is_admin())
    )
  );

-- Allow students to SELECT datasets that are attached to a published assignment
-- they could see (overrides the strict owner-only datasets policy when used as
-- part of an assignment payload).
create policy "datasets_select_via_assignment" on datasets
  for select using (
    exists (
      select 1 from assignment_datasets ad
      join assignments a on a.id = ad.assignment_id
      where ad.dataset_id = datasets.id
        and a.is_published
    )
  );

-- NOTE: Students access dataset files via short-lived signed URLs generated
-- server-side (service role bypasses storage RLS). No extra storage policy
-- needed — keeps the owner-only policy intact for direct uploads.
